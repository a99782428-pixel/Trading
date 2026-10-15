import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './views/LandingPage';
import { SignUpPage } from './views/SignUpPage';
import { SignInPage } from './views/SignInPage';
import { PersonalDetailsPage } from './views/PersonalDetailsPage';
import { QuestionnairePage } from './views/QuestionnairePage';
import { DepositMethodsPage } from './views/DepositMethodsPage';
import { DepositAmountPage } from './views/DepositAmountPage';
import { PaymentDetailsPage } from './views/PaymentDetailsPage';
import { TradingDashboardPage } from './views/TradingDashboardPage';
import { ProfilePage } from './views/ProfilePage';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [depositAmount, setDepositAmount] = useState<number>(200);

  // Set default view on user load
  React.useEffect(() => {
    if (!loading) {
      if (user) {
        if (!profile?.onboardingCompleted && profile?.onboardingStep === 2) {
          setCurrentView('personal-details');
        } else if (!profile?.onboardingCompleted && profile?.onboardingStep === 3) {
          setCurrentView('deposit-methods');
        } else if (!profile?.onboardingCompleted && profile?.onboardingStep === 4) {
          setCurrentView('questionnaire');
        } else if (currentView === 'landing' || currentView === 'signin' || currentView === 'signup') {
          setCurrentView('dashboard');
        }
      }
    }
  }, [user, profile?.onboardingCompleted, profile?.onboardingStep, loading]);

  const handleNavigate = (view: string, data?: any) => {
    if (data?.amount) {
      setDepositAmount(data.amount);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-['Inter']">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Connecting to Immediate Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] relative">
      {/* Main View Router */}
      {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
      {currentView === 'signup' && <SignUpPage onNavigate={handleNavigate} />}
      {currentView === 'signin' && <SignInPage onNavigate={handleNavigate} />}
      {currentView === 'personal-details' && <PersonalDetailsPage onNavigate={handleNavigate} />}
      {currentView === 'questionnaire' && <QuestionnairePage onNavigate={handleNavigate} />}
      {currentView === 'deposit-methods' && <DepositMethodsPage onNavigate={handleNavigate} />}
      {currentView === 'deposit-amount' && (
        <DepositAmountPage
          onNavigate={handleNavigate}
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
        />
      )}
      {currentView === 'payment-details' && (
        <PaymentDetailsPage
          onNavigate={handleNavigate}
          depositAmount={depositAmount}
        />
      )}
      {currentView === 'dashboard' && (
        <TradingDashboardPage
          onNavigate={handleNavigate}
          onOpenDeposit={() => handleNavigate('deposit-methods')}
        />
      )}
      {currentView === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
