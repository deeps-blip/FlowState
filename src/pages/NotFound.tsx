import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans antialiased text-white">
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-900/40">
        <Zap size={28} className="text-white" />
      </div>
      <div>
        <p className="text-6xl font-black text-indigo-500">404</p>
        <h1 className="text-2xl font-black text-white mt-2">Page not found</h1>
        <p className="text-slate-500 mt-2 text-sm">The page you're looking for doesn't exist.</p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
      >
        <ArrowLeft size={15} /> Back to Canvas
      </Link>
    </div>
  </div>
);

export default NotFound;
