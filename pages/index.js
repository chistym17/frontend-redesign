'use client'
import React, { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import HeroSection from '../components/Herosection';

export default function Home() {
  useEffect(()=>{
    const token = localStorage.getItem("access_token")
    if(!token){
      window.location.href = "/login"
    }
  }, [])
  return (
    <div>
      <Navbar />
      <HeroSection />
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Configure your AI Assistants</h2>
          <p className="text-gray-600 mb-6">Create assistants, add Q&A, and define custom tools for your business.</p>
          <Link href="/assistants" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            Manage Assistants
          </Link>
        </div>
      </section>
    </div>
  );
}