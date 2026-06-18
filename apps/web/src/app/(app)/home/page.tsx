'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { DateDisplay } from '@/components/DateDisplay';

type Job = {
  job_id: string;
  lead_id: string;
  provider_id: string;
  final_cost: number;
  before_photo?: string;
  after_photo?: string;
  completed_at: string;
  next_maintenance_due?: string;
  problem?: string;
  provider_name?: string;
};

export default function MyHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // TODO: Fetch actual jobs from API when auth is implemented
    // For now, showing empty state
    setLoading(false);
  }, []);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full">
          <style jsx>{`
            div {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-6"
          >
            ← Back to home
          </Link>
          <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">My Home</h1>
          <p className="text-base text-gray-600">Your maintenance history and upcoming reminders</p>
        </div>

        {/* Upcoming maintenance */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming maintenance</h2>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No maintenance scheduled</p>
            <p className="text-xs text-gray-500">
              We'll remind you when it's time for recurring maintenance
            </p>
          </div>
        </div>

        {/* Completed jobs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed jobs</h2>
          {jobs.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">No completed jobs yet</p>
              <p className="text-xs text-gray-500 mb-4">
                Once you complete a job, it will appear here as part of your home record
              </p>
              <Link
                href="/"
                className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Diagnose an issue
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.job_id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {job.problem || 'Maintenance job'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Completed <DateDisplay dateString={job.completed_at} />
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-gray-900">
                        ${job.final_cost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {job.provider_name && (
                    <div className="text-xs text-gray-600 mb-3">Provider: {job.provider_name}</div>
                  )}

                  {(job.before_photo || job.after_photo) && (
                    <div className="flex gap-4">
                      {job.before_photo && (
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-500 mb-2">Before</div>
                          <img
                            src={job.before_photo}
                            alt="Before"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      {job.after_photo && (
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-500 mb-2">After</div>
                          <img
                            src={job.after_photo}
                            alt="After"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {job.next_maintenance_due && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          Next maintenance due:{' '}
                          <DateDisplay dateString={job.next_maintenance_due} />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
