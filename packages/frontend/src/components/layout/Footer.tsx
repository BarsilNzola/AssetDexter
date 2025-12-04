import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-8 mt-16 border-t-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="text-center">
          {/* AssetDexter Logo */}
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg">
              AD
            </div>
            <h3 className="text-2xl font-bold font-pokemon tracking-wide">
              ASSET<span className="text-secondary">DEXTER</span>
            </h3>
          </div>
          
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Discover, analyze, and collect tokenized real-world assets. 
            Gotta catch 'em all in the world of RWAs!
          </p>
          
          {/* TheForeverKnights Branding */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-0.5 bg-gray-500"></div>
              <span className="text-gray-400 text-sm">A project by</span>
              <div className="w-4 h-0.5 bg-gray-500"></div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs border border-gray-700">
                TFK
              </div>
              <h4 className="text-lg font-bold text-gray-200 tracking-wider">
                TheForeverKnights
              </h4>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Building the future of decentralized gaming and finance
            </p>
          </div>
          
          {/* Copyright */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} AssetDexter by TheForeverKnights. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};