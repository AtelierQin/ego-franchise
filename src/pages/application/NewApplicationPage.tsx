import React from 'react';
import FranchiseApplicationForm from '../../components/application/FranchiseApplicationForm';
import { useNavigate } from 'react-router-dom';

const NewApplicationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleApplicationSuccess = (applicationId: string) => {
    console.log('Application submitted successfully with ID:', applicationId);
    // Potentially navigate to a 'thank you' page or a dashboard showing application status
    alert('您的加盟申请已成功提交！我们将尽快审核。');
    navigate('/'); // Navigate to home or a relevant dashboard page
  };

  const handleApplicationFailure = (error: Error) => {
    console.error('Application submission failed:', error);
    // Error is already handled and displayed within the form component, 
    // but we can add additional global error handling or logging here if needed.
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <img 
                className="mx-auto h-12 w-auto mb-4" 
                src="/logo.png" // Assuming logo is in public folder
                alt="逸刻新零售"
              />
              <h1 className="text-3xl font-extrabold text-gray-900">
                逸刻新零售加盟申请
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                感谢您对逸刻新零售的关注，请认真填写以下信息。
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <FranchiseApplicationForm 
              onSuccess={handleApplicationSuccess} 
              onFailure={handleApplicationFailure} 
            />
          </div>
        </div>
        <div className="mt-6 text-center">
            <button 
                onClick={() => navigate(-1)} 
                className="text-sm font-medium text-primary hover:text-primary-dark"
            >
                &larr; 返回
            </button>
        </div>
      </div>
    </div>
  );
};

export default NewApplicationPage;