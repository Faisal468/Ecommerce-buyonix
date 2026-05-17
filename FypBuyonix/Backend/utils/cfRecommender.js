/**
 * Utility module to interact with Python Collaborative Filtering model
 * Uses real MongoDB ObjectIds for personalized recommendations
 */

const path = require('path');
const fs = require('fs');
const Product = require('../models/product');
const User = require('../models/user');
const Interaction = require('../models/interaction');

const AI_MODELS_DIR = path.join(__dirname, '..', 'ai_models');
const RAILWAY_AI_URL = process.env.VISUAL_SEARCH_URL || 'https://ecommerce-buyonix-production.up.railway.app';

class CFRecommender {
  constructor() {
    this.modelReady = false;
    this.initializationError = null;
  }

  /**
   * Make HTTP request to Railway AI service
   */
  async railwayRequest(endpoint, method = 'GET', data = null) {
    const url = `${RAILWAY_AI_URL}${endpoint}`;
    const urlObj = new URL(url);
    const transport = require('https');

    return new Promise((resolve, reject) => {
      const body = data ? JSON.stringify(data) : null;
      const req = transport.request({
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(body && { 'Content-Length': Buffer.byteLength(body) })
        }
      }, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseBody));
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${responseBody}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(120000, () => reject(new Error('Request timeout')));
      if (body) req.write(body);
      req.end();
    });
  }

  /**
   * Fetch real user-product interactions from MongoDB
   */
  async getRealInteractions() {
    try {
      const interactions = await Interaction.find({})
        .select('userId productId weight rating action')
        .lean();

      return interactions.map(i => ({
        userId: i.userId.toString(),
        productId: i.productId.toString(),
        rating: i.rating || Math.min((i.weight || 1) / 2, 5)
      }));
    } catch (error) {
      console.warn('  ⚠️  Could not fetch interactions:', error.message);
      return [];
    }
  }

  /**
   * Generate synthetic interactions using REAL MongoDB IDs
   * Ensures even synthetic recommendations point to real products
   */
  async generateSyntheticInteractions() {
    try {
      const products = await Product.find({ status: 'active' }).select('_id').lean();
      const users = await User.find({}).select('_id').lean();
      const productIds = products.map(p => p._id.toString());
      const userIds = users.map(u => u._id.toString());

      if (productIds.length === 0 || userIds.length === 0) return [];

      const interactions = [];
      const ratingProbs = [0.05, 0.10, 0.20, 0.35, 0.30];

      for (let i = 0; i < 3000; i++) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const productId = productIds[Math.floor(Math.random() * productIds.length)];

        const rand = Math.random();
        let cumProb = 0;
        let rating = 3;
        for (let j = 0; j < ratingProbs.length; j++) {
          cumProb += ratingProbs[j];
          if (rand <= cumProb) { rating = j + 1; break; }
        }
        interactions.push({ userId, productId, rating });
      }
      return interactions;
    } catch (error) {
      console.warn('  ⚠️  Could not generate synthetic data:', error.message);
      return [];
    }
  }

  /**
   * Train CF model by passing interactions to Railway AI
   */
  async trainModel(interactions) {
    const result = await this.railwayRequest('/cf/train', 'POST', { interactions });
    if (result.error) throw new Error(result.error);
    if (result.stats) return result.stats;
    throw new Error('Unknown error from Railway AI model');
  }

  /**
   * Initialize the model on server startup
   */
  async initialize() {
    return new Promise(async (resolve) => {
      console.log('🤖 Initializing Collaborative Filtering model...');

      try {
        // Check Railway is available
        const health = await this.railwayRequest('/health', 'GET');
        if (!health || health.status !== 'healthy') {
          console.warn('⚠️  Railway AI service not available');
          resolve(false);
          return;
        }

        // CF model already loaded on Railway (cf_model.pkl)
        if (health.cf_model === true) {
          console.log('✓ CF Model already loaded on Railway');
          this.modelReady = true;
          resolve(true);
          return;
        }

        // Fetch real interactions from MongoDB
        let interactions = await this.getRealInteractions();
        let source = 'real_interactions';

        if (interactions.length < 10) {
          console.log(`  ℹ️  Only ${interactions.length} real interactions, using synthetic data with real IDs...`);
          interactions = await this.generateSyntheticInteractions();
          source = 'synthetic_with_real_ids';
        }

        if (interactions.length === 0) {
          console.warn('⚠️  No data available for model training');
          resolve(false);
          return;
        }

        console.log(`  ℹ️  Training with ${interactions.length} interactions (${source})`);

        this.trainModel(interactions)
          .then((stats) => {
            console.log('✓ CF Model initialized successfully');
            console.log(`  Users: ${stats.n_users}, Products: ${stats.n_products} (${source})`);
            this.modelReady = true;
            resolve(true);
          })
          .catch((error) => {
            console.warn('⚠️  Could not initialize CF model:', error.message);
            this.modelReady = false;
            resolve(false);
          });
      } catch (error) {
        console.warn('⚠️  Initialization error:', error.message);
        resolve(false);
      }
    });
  }

  /**
   * Get recommendations from Railway AI model
   */
  async getRecommendations(userId, numRecommendations = 5) {
    if (!this.modelReady) throw new Error('CF model not initialized');

    const result = await this.railwayRequest(
      `/recommendations/${userId}?limit=${numRecommendations}`,
      'GET'
    );

    if (result.error) throw new Error(result.error);
    if (result.recommendations !== undefined) return result.recommendations;
    throw new Error('Unknown error');
  }

  /**
   * Get model statistics from Railway
   */
  async getModelStats() {
    const result = await this.railwayRequest('/health', 'GET');
    if (result.error) throw new Error(result.error);
    if (result.stats) return result.stats;
    return result;
  }

  /**
   * Retrain model with fresh data from MongoDB
   */
  async retrain() {
    console.log('🔄 Starting model retraining...');

    let interactions = await this.getRealInteractions();
    let source = 'real_interactions';

    if (interactions.length < 10) {
      interactions = await this.generateSyntheticInteractions();
      source = 'synthetic_with_real_ids';
    }

    console.log(`  ℹ️  Retraining with ${interactions.length} interactions (${source})`);

    const stats = await this.trainModel(interactions);
    this.modelReady = true;
    console.log('✓ Model retrained successfully');
    console.log(`  Users: ${stats.n_users}, Products: ${stats.n_products}`);

    return { success: true, stats, source };
  }

  /**
   * Main API function - recommend products for a user
   * Now uses REAL MongoDB userId directly (no synthetic mapping)
   */
  async recommendForUser(userId, numRecommendations = 5) {
    try {
      const recommendations = await this.getRecommendations(
        String(userId),
        numRecommendations
      );

      // product_id values are now real MongoDB ObjectIds
      return recommendations.map(rec => ({
        productId: rec.product_id,
        predictedRating: rec.predicted_rating,
        reason: 'Based on collaborative filtering analysis'
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
}

module.exports = CFRecommender;
