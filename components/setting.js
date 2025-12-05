// settings.js
import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import LeftSidebar from '../components/LeftSidebar';
import { useSidebar } from '../lib/sidebarContext';
const Settings = () => {
   const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mockProfileImage, setMockProfileImage] = useState(null);
  const { isCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
 
  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [isActive1, setIsActive1] = useState(false);
  const [isActive2, setIsActive2] = useState(false);
  const [isActive3, setIsActive3] = useState(false);
  const [isActive4, setIsActive4] = useState(false);

  const toggle1 = () => setIsActive1((prev) => !prev);
  const toggle2 = () => setIsActive2((prev) => !prev);
  const toggle3 = () => setIsActive3((prev) => !prev);
  const toggle4 = () => setIsActive4((prev) => !prev);

  const [switches, setSwitches] = useState({
    databaseContext: true,  // true = active, false = inactive
    businessRules: false,
  });

  const handleToggle = (key) => {
    setSwitches(prev => ({ ...prev, [key]: !prev[key] }));
  };



  // Pick file
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Mock upload function
  const upload = async () => {
    if (!image) return;
    setUploading(true);

    setTimeout(() => {
      // pretend we uploaded and got a URL
      setMockProfileImage(preview);
      setUploading(false);
    }, 1500);
  };

  const profileImage = mockProfileImage; // using mock
  return (
   
   
     <div className="fixed inset-0 bg-[#141A21] overflow-y-auto flex p-4">

         <LeftSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
         
         <div className={`flex-1 transition-all duration-300 ${isMobile ? 'ml-0' : isCollapsed ? 'ml-16' : 'ml-48'} flex items-start justify-center `}>
      <div className="max-w-7xl mx-auto">
         {/* Header */}
          <div className="mb-8 animate-fade-in-up">
     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 ">
             {isMobile && !mobileOpen && (
                <button
                  className="mobile-menu-btn"
                  onClick={() => setMobileOpen(true)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.8 13.1999H1.2C0.881741 13.1999 0.576516 13.0734 0.351472 12.8484C0.126428 12.6234 0 12.3181 0 11.9999C0 11.6816 0.126428 11.3764 0.351472 11.1514C0.576516 10.9263 0.881741 10.7999 1.2 10.7999H22.8C23.1182 10.7999 23.4235 10.9263 23.6485 11.1514C23.8735 11.3764 24 11.6816 24 11.9999C24 12.3181 23.8735 12.6234 23.6485 12.8484C23.4235 13.0734 23.1182 13.1999 22.8 13.1999ZM22.8 4.7999H1.2C0.881741 4.7999 0.576516 4.67347 0.351472 4.44843C0.126428 4.22339 0 3.91817 0 3.5999C0 3.28164 0.126428 2.97642 0.351472 2.75137C0.576516 2.52633 0.881741 2.3999 1.2 2.3999H22.8C23.1182 2.3999 23.4235 2.52633 23.6485 2.75137C23.8735 2.97642 24 3.28164 24 3.5999C24 3.91817 23.8735 4.22339 23.6485 4.44843C23.4235 4.67347 23.1182 4.7999 22.8 4.7999ZM22.8 21.5999H1.2C0.881741 21.5999 0.576516 21.4734 0.351472 21.2484C0.126428 21.0234 0 20.7181 0 20.3999C0 20.0817 0.126428 19.7764 0.351472 19.5514C0.576516 19.3264 0.881741 19.1999 1.2 19.1999H22.8C23.1182 19.1999 23.4235 19.3264 23.6485 19.5514C23.8735 19.7764 24 20.0817 24 20.3999C24 20.7181 23.8735 21.0234 23.6485 21.2484C23.4235 21.4734 23.1182 21.5999 22.8 21.5999Z" fill="white"/>
                  </svg>
                </button>
              )}
                </div>
  
        {/* Main Grid: Stack on mobile, side-by-side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-[307px_1fr] gap-6">
          
          
          {/* First Column: Update Avatar */}
          <div className="flex flex-col items-center p-4 gap-4 w-full lg:w-[307px] h-[400px] lg:h-[400px] bg-white/5 backdrop-blur-[25px] rounded-2xl border border-white/10">
          
            {/* Avatar Update Content Here */}
            {/* Stack */}
              <div className="flex flex-col items-center p-0 gap-6 w-[175px] h-[204px]">
                {/* Upload */}
                <div className="flex flex-col items-center gap-2 w-full max-w-[300px]">
                    {/* Dashed Circle Wrapper */}
              <div className="w-[150px] h-[150px] rounded-full border-2 border-dashed border-[#13F584]/40 flex items-center justify-center relative">
              <div className="w-[140px] h-[140px] rounded-full overflow-hidden border border-white/20 relative">
                {profileImage ? (
                  <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/50">No Image
              
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              </div>
              <button
                      onClick={upload}
                      disabled={!image || uploading}
                    className="w-[150px] h-[36px] px-3 py-0 flex items-center justify-center gap-2 
                                                  text-[#9EFBCD] bg-[rgba(19,245,132,0.08)] rounded-lg font-bold text-sm"
                    >
                    
                      <span className="relative z-10">{uploading ? "Uploading..." : "Upload Image"}</span>
                    </button>

                    </div>
                  
                  {/* Allowed *.jpeg, *.jpg */}
                  <div className="flex flex-col items-center p-0 gap-[9px] w-[125px] h-[38px]">
                  <span className="w-[175px] h-[36px] text-xs leading-[18px] text-center text-[#919EAB] font-normal">Allowed *.jpeg, *.jpg, *.png, *.gif</span>
                  <span className="w-[175px] h-[36px] text-xs leading-[18px] text-center text-[#919EAB] font-normal">Max size of 3.1 MB</span>
                  </div>
                  {/* Switch */}
                <div className="flex items-center gap-2">
                {/* Text */}
                <span className="text-white text-sm font-medium">Block Profile</span>

                {/* Toggle Button */}
                <button
                type="button"
                aria-pressed={isActive1}
                aria-label={isActive1 ? "Active" : "Inactive"}
                onClick={toggle1}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                isActive1 ? "bg-[#13F584] border-white/5" : "bg-white/10 border-white/5 hover:bg-white/15"
                }`}
            >
                <span
                className={`inline-block h-4 w-4 transform rounded-full transition ${
                    isActive1 ? "translate-x-6 bg-white" : "translate-x-1 bg-white"
                }`}
                />
            </button>
            </div>


    
           <button
            className="
              w-[140px] h-[80px]
              px-4 py-2
              flex items-center justify-center gap-2
              text-[#FFAC82]
              bg-[rgba(255,86,48,0.12)]
              rounded-xl
              font-bold text-base
            "
          >
            Delete user
          </button>

          </div>
            {/* Add your avatar update form/components */}
          </div>
          
          {/* Second Column: Stack of 3 components */}
          <div className="flex flex-col gap-6">
            
         {/* Update User */}
          <div className="flex flex-col items-start p-4 gap-4 w-full h-auto lg:h-[520px] bg-white/5 backdrop-blur-[10px] rounded-2xl border border-white/10">
  
  
  {/* Frame 1000003793 */}
  <div className="flex flex-col items-start p-0 gap-5 w-full">
    
    {/* Stack for Name and Phone Number */}
    <div className="flex flex-col items-start p-0 gap-1 w-full">
      <span className="w-[143px] h-[28px] text-lg font-semibold leading-[28px] text-white">User Information</span>
      <span className="w-full h-[22px] text-sm leading-[22px] text-[#919EAB]">Update your personal information</span>
    </div>
    
    {/* Row for Name and Phone Number */}
    <div className="flex flex-row flex-wrap items-start  content-start p-0 gap-6 w-full">
      {/* TextField for Name */}
      <div className="flex flex-col items-start p-0 w-full md:w-[349.5px] min-w-[250px] h-[54px]">
        <div className="relative flex flex-row items-center p-0 px-4 isolate w-full h-[45px] bg-white/3 backdrop-blur-[25px] border border-[rgba(255,255,255,0.12)] rounded-lg">
            <input
                type="text"
                placeholder="Name"
                className="flex-1 h-[22px] text-sm leading-[22px] text-white bg-transparent border-none outline-none placeholder:text-white"
            />
          {/* Label Focus */}
         <div className="absolute flex flex-row items-center p-0 px-1 isolate w-[40px] h-[9px] left-4 -top-4">
           
            <span className="w-[34px] h-[9px] text-xs leading-[12px] font-semibold text-[#919EAB]">Name</span>
          </div>
        </div>
      </div>
      
      {/* TextField for Phone Number */}
      <div className="flex flex-col items-start p-0 w-full md:w-[349.5px] min-w-[250px] h-[45px]">
        <div className="relative flex flex-row items-center p-0 px-4 isolate w-full h-[54px] bg-white/3 backdrop-blur-[25px] border border-[rgba(255,255,255,0.12)] rounded-lg">
          <input
            type="tel"
            placeholder="Phone Number"
            className="flex-1 h-[22px] text-sm leading-[22px] text-white bg-transparent border-none outline-none placeholder:text-white"
          />
          {/* Label Focus */}
          <div className="absolute flex flex-row items-center p-0 px-1 isolate w-[100px] h-[9px] left-4 -top-4">
            
            <span className="w-[100px] h-[9px] text-xs leading-[12px] font-semibold text-[#919EAB]">Phone Number</span>
          </div>
        </div>
      </div>
    </div>
    
    {/* Row for Address */}
    <div className="flex flex-row flex-wrap items-start content-start p-0 gap-6 w-full">
      {/* TextField for Address */}
      <div className="flex flex-col items-start p-0 w-full min-w-[250px] h-[54px]">
        <div className="relative flex flex-row items-center p-0 px-4 isolate w-full h-[45px] bg-white/3 backdrop-blur-[25px] border border-[rgba(255,255,255,0.12)] rounded-lg">
          <input
            type="text"
            placeholder="Address"
            className="flex-1 h-[22px] text-sm leading-[22px] text-white bg-transparent border-none outline-none placeholder:text-white"
          />
          {/* Label Focus */}
          <div className="absolute flex flex-row items-center p-0 px-1 isolate w-[100px] h-[9px] left-4 -top-4">
           
            <span className="w-[47px] h-[9px] text-xs leading-[12px] font-semibold text-[#919EAB]">Address</span>
          </div>
        </div>
      </div>
    </div>
    
    {/* Textarea for About */}
    <div className="flex flex-col items-start p-0 isolate w-full min-w-[250px] h-[98px] rounded-lg">
      <div className="relative flex flex-row items-start p-[16px] px-[14px] isolate w-full min-h-[98px] bg-white/3 backdrop-blur-[25px] border border-[rgba(255,255,255,0.12)] rounded-lg">
        <textarea
          placeholder="About"
          className="flex-1 h-[44px] text-sm leading-[22px] text-white bg-transparent border-none outline-none resize-none placeholder:text-white"
        ></textarea>
        {/* Label Focus */}
        <div className="absolute flex flex-row items-center p-0 px-1 isolate w-[100px] h-[9px] left-4 -top-4">
          
          <span className="w-[35px] h-[9px] text-xs leading-[12px] font-semibold text-[#919EAB]">About</span>
        </div>
      </div>
    </div>
    
    {/* Frame 1000003794 */}
    <div className="flex flex-col items-start p-0 gap-5 w-full">
      
      {/* Stack for Email and Last Name */}
      <div className="flex flex-col items-start p-0 gap-1 w-[344px] min-w-[250px]">
        <span className="w-[73px] h-[28px] text-lg font-semibold leading-[28px] text-white">Security</span>
        <span className="w-full h-[22px] text-sm leading-[22px] text-[#919EAB]">Update your security details</span>
      </div>
      
      {/* Row for Email and Last Name */}
      <div className="flex flex-row flex-wrap items-start content-start p-0 gap-6 w-full">
        {/* TextField for Email */}
        <div className="flex flex-col items-start p-0 w-full md:w-[349.5px] min-w-[250px] h-[80px]">
          <div className="relative flex flex-row items-center p-0 px-[14px] isolate w-full h-[45px] bg-white/3 backdrop-blur-[25px] border border-[rgba(255,255,255,0.12)] rounded-lg">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 h-[22px] text-sm leading-[22px] text-white bg-transparent border-none outline-none placeholder:text-white"
            />
            {/* Label Focus */}
            <div className="absolute flex flex-row items-center p-0 px-1 isolate w-[100px] h-[9px] left-4 -top-4">
      
              <span className="w-[32px] h-[9px] text-xs leading-[12px] font-semibold text-[#919EAB]">Email</span>
            </div>
          </div>
          {/* Helper Text */}
          <div className="flex flex-row items-center p-2 px-3 gap-1 w-full h-[26px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM8 12C7.45 12 7 11.55 7 11C7 10.45 7.45 10 8 10C8.55 10 9 10.45 9 11C9 11.55 8.55 12 8 12ZM9 8H7V4H9V8Z" fill="#919EAB"/>
            </svg>
            <span className="flex-1 h-[18px] text-xs leading-[18px] text-[#919EAB]">This will be your login email</span>
          </div>
        </div>
        
        {/* TextField for Password */}
        <div className="flex flex-col items-start p-0 w-full md:w-[349.5px] min-w-[250px] h-[80px]">
          <div className="relative flex flex-row items-center p-0 px-[14px] isolate w-full h-[45px] bg-white/3 backdrop-blur-[25px] border  border-[rgba(255,255,255,0.12)] rounded-lg">
            <input
              type="text"
              placeholder="Password"
              className="flex-1 h-[22px] text-sm leading-[22px] text-white bg-transparent border-none outline-none placeholder:text-white"
            />
            {/* Label Focus */}
            <div className="absolute flex flex-row items-center p-0 px-1 isolate w-[100px] h-[9px] left-4 -top-4">
          
              <span className="w-[100px] h-[9px] text-xs leading-[12px] font-semibold text-[#919EAB]">Password</span>
            </div>
          </div>
          {/* Helper Text */}
          <div className="flex flex-row items-center p-2 px-3 gap-1 w-full h-[26px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM8 12C7.45 12 7 11.55 7 11C7 10.45 7.45 10 8 10C8.55 10 9 10.45 9 11C9 11.55 8.55 12 8 12ZM9 8H7V4H9V8Z" fill="#919EAB"/>
            </svg>
            <span className="flex-1 h-[18px] text-xs leading-[18px] text-[#919EAB]">Change Password</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

            
            {/* Notification 1 */}
            <div className="flex flex-col items-start p-4 gap-4 w-full h-auto lg:h-[222px] bg-white/5 backdrop-blur-[10px] rounded-2xl border border-white/10">
            {/* Stack */}
  <div className="flex flex-row flex-wrap items-start content-start p-0 gap-6 w-full">
    
    {/* Sub-stack */}
    <div className="flex flex-col items-start p-0 gap-1 w-[335px] min-w-[294px]">
      <span className="w-[66px] h-[28px] text-lg font-semibold leading-[28px] text-white">Activity</span>
      <span className="w-full h-[22px] text-sm leading-[22px] text-[#919EAB]">Manage your notification preferences</span>
    </div>
    
    {/* Notification Card */}
    <div className="box-border flex flex-col items-start p-4 gap-4 w-[360px] min-w-[250px] h-[190px] bg-white/3 backdrop-blur-[25px] rounded-2xl">
      
      {/* Switch 1: Email notifications */}
      <div className="flex flex-row items-start gap-3 w-full">
        <span className="flex-1 text-sm leading-[20px] text-white whitespace-normal break-words">
          Email me when someone comments on my article
        </span>

        <button
          type="button"
          aria-pressed={isActive2}
          aria-label={isActive2 ? "Active" : "Inactive"}
          onClick={toggle2}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors ${
            isActive2
              ? "bg-[#13F584] border-white/5"
              : "bg-white/10 border-white/5 hover:bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition ${
              isActive2 ? "translate-x-6 bg-white" : "translate-x-1 bg-white"
            }`}
          />
        </button>
      </div>

      {/* Switch 2: Push notifications */}
      <div className="flex flex-row items-start gap-3 w-full">
        <span className="flex-1 text-sm leading-[20px] text-white whitespace-normal break-words">
          Email me when someone comments on my article
        </span>

        <button
          type="button"
          aria-pressed={isActive2}
          aria-label={isActive2 ? "Active" : "Inactive"}
          onClick={toggle2}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors ${
            isActive2
              ? "bg-[#13F584] border-white/5"
              : "bg-white/10 border-white/5 hover:bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition ${
              isActive2 ? "translate-x-6 bg-white" : "translate-x-1 bg-white"
            }`}
          />
        </button>
      </div>

      
      {/* Switch 3: Another notification (e.g., SMS) */}
          <div className="flex flex-row items-start gap-3 w-full">
      <span className="flex-1 text-sm leading-[20px] text-white whitespace-normal break-words">
        Email me when someone comments on my article
      </span>

      <button
        type="button"
        aria-pressed={isActive2}
        aria-label={isActive2 ? "Active" : "Inactive"}
        onClick={toggle2}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors ${
          isActive2
            ? "bg-[#13F584] border-white/5"
            : "bg-white/10 border-white/5 hover:bg-white/15"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full transition ${
            isActive2 ? "translate-x-6 bg-white" : "translate-x-1 bg-white"
          }`}
        />
      </button>
    </div>

      
    </div>
  </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
    </div>
</div>
  );
};

export default Settings;
