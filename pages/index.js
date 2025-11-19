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
      
    </div>
  );
}