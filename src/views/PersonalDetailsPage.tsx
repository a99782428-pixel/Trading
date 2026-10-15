import React, { useState } from 'react';
import { ShieldCheck, X, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

interface PersonalDetailsPageProps {
  onNavigate: (view: string) => void;
}

export function PersonalDetailsPage({ onNavigate }: PersonalDetailsPageProps) {
  const { profile, updateProfileData } = useAuth();

  const [bannerVisible, setBannerVisible] = useState(true);
  const [address, setAddress] = useState(profile?.address || '');
  const [country, setCountry] = useState(profile?.country || 'Nigeria');
  const [city, setCity] = useState(profile?.city || '');
  const [postalCode, setPostalCode] = useState(profile?.postalCode || '');
  const [nationality, setNationality] = useState(profile?.nationality || 'Nigeria');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || '');
  const [idType, setIdType] = useState(profile?.idType || 'National ID');
  const [idNumber, setIdNumber] = useState(profile?.idNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address.trim() || !city.trim() || !dateOfBirth) {
      setError('Please provide your residential address, city, and date of birth.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileData({
        address: address.trim(),
        country,
        city: city.trim(),
        postalCode: postalCode.trim(),
        nationality,
        dateOfBirth,
        idType,
        idNumber: idNumber.trim(),
        verificationStatus: 'pending',
        onboardingStep: 3
      });
      // Move to Deposit Methods (Flow: Personal Details -> Deposit -> Questionnaire -> Dashboard)
      onNavigate('deposit-methods');
    } catch (err: any) {
      setError(err.message || 'Failed to save personal details.');
    } finally {
      setIsSaving(false);
    }
  };

  const userDisplayName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Trader';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <Header currentView="personal-details" onNavigate={onNavigate} showBack backDestination="dashboard" />

      <main className="flex-1 flex flex-col items-center justify-start p-4 py-8">
        <div className="w-full max-w-[460px]">
          
          {/* Top compliance notice banner matching screenshot */}
          {bannerVisible && (
            <div className="mb-6 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 text-xs flex items-start justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="leading-relaxed text-[11px] text-blue-800">
                  To secure your account and comply with regulatory obligations, we kindly ask you to complete the account verification process.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBannerVisible(false)}
                className="text-blue-400 hover:text-blue-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
            <div className="mb-6">
              <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
                STEP 2 OF 4 · PERSONAL DETAILS
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 mb-1 tracking-tight">
                We want to know you better
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Welcome {userDisplayName}, you are a few steps away from your first financial move. The world of trading awaits.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleProceed} className="space-y-5">
              
              {/* Address Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Address
                </h3>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street address"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Country of residence
                  </label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    >
                      <option value="Nigeria">Nigeria</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Ghana">Ghana</option>
                      <option value="United States">United States</option>
                      <option value="Germany">Germany</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Zip or Postal code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Zip code"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Nationality and Date of birth */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Nationality and Date of birth
                </h3>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Nationality
                  </label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="British">British</option>
                    <option value="South African">South African</option>
                    <option value="Kenyan">Kenyan</option>
                    <option value="Ghanaian">Ghanaian</option>
                    <option value="American">American</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Date of birth <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ID section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  ID
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      ID type (optional)
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    >
                      <option value="National ID">National ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="Voter's Card">Voter's Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      ID number (optional)
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="Enter ID number"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{isSaving ? 'Saving...' : 'Proceed'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
