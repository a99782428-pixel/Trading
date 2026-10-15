import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import type { QuestionnaireAnswers } from '../types';

interface QuestionnairePageProps {
  onNavigate: (view: string) => void;
}

interface QuestionDef {
  key: keyof QuestionnaireAnswers;
  number: number;
  title: string;
  subtitle: string;
  options: string[];
}

const QUESTIONS: QuestionDef[] = [
  {
    key: 'q1_age',
    number: 1,
    title: 'Your Age',
    subtitle: 'Select your age range to help customize your experience.',
    options: ['20–30', '31–40', '41–50', '50+']
  },
  {
    key: 'q2_profession',
    number: 2,
    title: 'Your Profession',
    subtitle: 'What do you do?',
    options: ['Student', 'Employee', 'Business Owner', 'Freelancer', 'Other']
  },
  {
    key: 'q3_tradingExperience',
    number: 3,
    title: 'Trading Experience',
    subtitle: 'How long have you been actively trading financial markets?',
    options: ['No experience (Beginner)', 'Under 1 Year', '1–3 Years', 'More than 3 Years']
  },
  {
    key: 'q4_marketKnowledge',
    number: 4,
    title: 'Financial Market Familiarity',
    subtitle: 'How familiar are you with margin trading and leverage?',
    options: ['Basic understanding', 'Intermediate knowledge', 'Advanced / Professional']
  },
  {
    key: 'q5_investmentGoals',
    number: 5,
    title: 'Investment Goals',
    subtitle: 'What is your primary financial objective with Immediate?',
    options: ['Capital Growth', 'Regular Secondary Income', 'Active Speculation', 'Wealth Preservation']
  },
  {
    key: 'q6_riskTolerance',
    number: 6,
    title: 'Risk Tolerance',
    subtitle: 'How comfortable are you with short-term price fluctuations?',
    options: ['Conservative / Low Risk', 'Moderate / Balanced', 'Aggressive / High Growth']
  },
  {
    key: 'q7_timeHorizon',
    number: 7,
    title: 'Investment Time Horizon',
    subtitle: 'What timeframe do you envision keeping positions open?',
    options: ['Intraday / Short Term (< 1 Month)', 'Medium Term (1–12 Months)', 'Long Term (1+ Years)']
  }
];

export function QuestionnairePage({ onNavigate }: QuestionnairePageProps) {
  const { questionnaire, saveQuestionnaireAnswers } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0); // Start at Question 1 of 7
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() => ({
    q1_age: questionnaire?.q1_age || '',
    q2_profession: questionnaire?.q2_profession || '',
    q3_tradingExperience: questionnaire?.q3_tradingExperience || '',
    q4_marketKnowledge: questionnaire?.q4_marketKnowledge || '',
    q5_investmentGoals: questionnaire?.q5_investmentGoals || '',
    q6_riskTolerance: questionnaire?.q6_riskTolerance || '',
    q7_timeHorizon: questionnaire?.q7_timeHorizon || ''
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQ = QUESTIONS[currentIndex];
  const selectedOption = answers[currentQ.key] || '';

  const handleSelect = (opt: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: opt }));
  };

  const handleNext = async () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Save all answers to Firestore and route directly to Trading Dashboard
      setIsSubmitting(true);
      try {
        await saveQuestionnaireAnswers(answers);
        onNavigate('dashboard');
      } catch (e) {
        console.error('Error saving questionnaire:', e);
        onNavigate('dashboard');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      // Back at question 1 goes back to deposit payment details
      onNavigate('payment-details');
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Header currentView="questionnaire" onNavigate={onNavigate} showBack backDestination="payment-details" />

      {/* Blue top progress bar matching screenshot */}
      <div className="w-full bg-slate-100 h-1">
        <div
          className="bg-blue-600 h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          
          <div className="text-center mb-6 sm:mb-8">
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              STEP 4 OF 4 · INVESTOR PROFILE
            </span>
            <div className="mt-3 text-xs font-semibold text-slate-400 tracking-wider">
              Question {currentQ.number} of {QUESTIONS.length}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 mb-1.5 tracking-tight">
              {currentQ.title}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed px-2">
              {currentQ.subtitle}
            </p>
          </div>

          {/* Options List matching screenshot card styling */}
          <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 text-blue-900 shadow-2xs ring-1 ring-blue-600/30'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{opt}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-4 sm:px-5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || !selectedOption}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Finalizing Profile...' : currentIndex === QUESTIONS.length - 1 ? 'Complete & Start Trading' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
