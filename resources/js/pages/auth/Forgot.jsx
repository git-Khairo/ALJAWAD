import { Navigate } from 'react-router-dom';

// Password reset now goes through the phone + one-time code flow (Claim).
const Forgot = () => <Navigate to="/auth/claim" replace />;

export default Forgot;
