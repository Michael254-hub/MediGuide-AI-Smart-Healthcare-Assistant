import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import api from '../services/api';

const submitSymptomSchema = z.object({
  symptoms: z.string().min(5, 'Please describe your symptoms in more detail'),
  duration: z.string().min(1, 'Please select how long you have had these symptoms'),
  severity: z.enum(['mild', 'moderate', 'severe'], {
    errorMap: () => ({ message: 'Please select a severity level' })
  })
});

const SubmitSymptoms = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(submitSymptomSchema),
    defaultValues: {
      severity: 'mild'
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/symptoms', data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-med-dark to-slate-800 p-8 sm:p-12 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Symptom Assessment</h1>
            <p className="text-slate-300 text-lg max-w-2xl">Please describe how you're feeling accurately so our AI system can provide the best possible guidance.</p>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-3">
              <label className="text-lg font-bold text-med-dark block">
                1. What symptoms are you experiencing?
              </label>
              <p className="text-sm text-med-muted mb-4">Please be as specific as possible (e.g., "sharp chest pain when breathing", "mild fever and headache").</p>
              <textarea 
                {...register('symptoms')}
                rows="4"
                className={`w-full px-5 py-4 rounded-2xl border ${errors.symptoms ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-med-primary focus:ring-med-primary/20'} resize-none focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white text-med-dark`}
                placeholder="Describe your symptoms here..."
              ></textarea>
              {errors.symptoms && <p className="text-sm text-red-500 font-medium">{errors.symptoms.message}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-lg font-bold text-med-dark block">
                2. How long have you had these symptoms?
              </label>
              <select 
                {...register('duration')}
                className={`w-full px-5 py-4 rounded-2xl border ${errors.duration ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-med-primary focus:ring-med-primary/20'} appearance-none focus:outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white text-med-dark`}
              >
                <option value="">Select duration...</option>
                <option value="Just started (less than a day)">Just started (less than a day)</option>
                <option value="1-3 days">1-3 days</option>
                <option value="4-7 days">4-7 days</option>
                <option value="1-2 weeks">1-2 weeks</option>
                <option value="More than 2 weeks">More than 2 weeks</option>
              </select>
              {errors.duration && <p className="text-sm text-red-500 font-medium">{errors.duration.message}</p>}
            </div>

            <div className="space-y-4">
              <label className="text-lg font-bold text-med-dark block">
                3. How severe are your symptoms?
              </label>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { id: 'mild', label: 'Mild', desc: 'Noticeable, but not interfering with daily activities' },
                  { id: 'moderate', label: 'Moderate', desc: 'Interfering significantly with daily activities' },
                  { id: 'severe', label: 'Severe', desc: 'Incapacitating or unbearable' }
                ].map(level => (
                  <label 
                    key={level.id}
                    className="cursor-pointer group"
                  >
                    <input 
                      type="radio" 
                      value={level.id} 
                      {...register('severity')}
                      className="sr-only peer" 
                    />
                    <div className="h-full p-5 rounded-2xl border-2 border-slate-200 peer-checked:border-med-primary peer-checked:bg-blue-50 transition-all hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-med-dark capitalize">{level.label}</span>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-med-primary flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-med-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">{level.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.severity && <p className="text-sm text-red-500 font-medium">{errors.severity.message}</p>}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-8 py-4 bg-med-primary hover:bg-med-secondary text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:shadow-none hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>Analyze Symptoms <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitSymptoms;
