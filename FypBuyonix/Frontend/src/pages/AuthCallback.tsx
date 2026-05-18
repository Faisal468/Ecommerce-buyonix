import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    if (id && email) {
      const user = { id, displayName: name || '', email };
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userInfo', JSON.stringify(user));
      window.dispatchEvent(new Event('authStatusChanged'));
    }

    navigate('/', { replace: true });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
