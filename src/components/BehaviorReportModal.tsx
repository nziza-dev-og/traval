import  { useState, FormEvent } from 'react';
import { Student, BehaviorType } from '../types';
import { AlertTriangle, ThumbsUp, X } from 'lucide-react';

interface BehaviorReportModalProps {
  student: Student;
  tripId: string;
  onSubmit: (report: {
    studentId: string;
    type: BehaviorType;
    description: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const BehaviorReportModal = ({
  student,
  tripId,
  onSubmit,
  onClose
}: BehaviorReportModalProps) => {
  const [type, setType] = useState<BehaviorType>(BehaviorType.MISCONDUCT);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        studentId: student.id,
        type,
        description
      });
      onClose();
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting behavior report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold mb-4">Report Student Behavior</h2>
        <p className="text-gray-600 mb-4">
          Submit a behavior report for {student.fullName}
        </p>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Behavior Type</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div 
                onClick={() => setType(BehaviorType.MISCONDUCT)}
                className={`p-3 rounded-md cursor-pointer border ${
                  type === BehaviorType.MISCONDUCT 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium">Misconduct</span>
                </div>
              </div>
              
              <div 
                onClick={() => setType(BehaviorType.BULLYING)}
                className={`p-3 rounded-md cursor-pointer border ${
                  type === BehaviorType.BULLYING 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium">Bullying</span>
                </div>
              </div>
              
              <div 
                onClick={() => setType(BehaviorType.DISRUPTIVE)}
                className={`p-3 rounded-md cursor-pointer border ${
                  type === BehaviorType.DISRUPTIVE 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="font-medium">Disruptive</span>
                </div>
              </div>
              
              <div 
                onClick={() => setType(BehaviorType.POSITIVE)}
                className={`p-3 rounded-md cursor-pointer border ${
                  type === BehaviorType.POSITIVE 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">Positive</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input h-24"
              placeholder="Provide details about the behavior..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !description.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
 