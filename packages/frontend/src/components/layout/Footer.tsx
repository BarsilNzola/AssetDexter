import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
            <h3 className="text-xl font-bold font-pokemon">ASSETDEXTER</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Discover, analyze, and collect tokenized real-world assets
          </p>
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AssetDexter. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};