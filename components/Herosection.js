import { Mic, ArrowRight, Star, Clock, Shield, Bot, Sparkles, Zap, MessageSquare, Users, TrendingUp, Workflow, Check, Code, Globe, Headphones } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const HeroSection = () => {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const cardsData = [
    { title: "Restaurants", subtitle: "Orders & Reservations" },
    { title: "E-commerce", subtitle: "Customer Support" },
    { title: "Healthcare", subtitle: "Patient Management" },
    { title: "Education", subtitle: "Learning Assistance" },
    { title: "Finance", subtitle: "Accounts & Transactions" },
    { title: "Real Estate", subtitle: "Property Listings" },
    { title: "Travel", subtitle: "Booking & Guidance" },
    { title: "Travel", subtitle: "Booking & Guidance" },
    { title: "Entertainment", subtitle: "Recommendations" },
    { title: "Fitness", subtitle: "Workout & Nutrition" },
    { title: "Legal", subtitle: "Case Management" },
    { title: "Automotive", subtitle: "Sales & Services" },
    { title: "Marketing", subtitle: "Campaign Management" },
    { title: "Hospitality", subtitle: "Reservations & Feedback" },
    { title: "Technology", subtitle: "IT Solutions & Support" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
   <div 
  className="min-h-screen bg-[#000B06]"
  style={{
    backgroundImage: "url('/images/viewbox.svg'), url('/images/gloweffect.svg')",
    backgroundRepeat: "no-repeat, no-repeat",
    backgroundPosition: "top left, top right",
    backgroundSize: "auto, auto", // adjust the glow size as needed
  }}
>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, #10b981 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transition: 'background-position 0.3s ease'
          }}> 
        
         
          
          </div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-32 left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">

            {/* Left Content */}
            <div className={`space-y-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Badge */}
            

              {/* Main Heading */}
              <div className="space-y-6">
                <h1
                className="
                  font-inter font-medium text-center tracking-[-0.0506em]
                  w-full max-w-[827px] mx-auto

                  text-3xl       /* mobile */
                  leading-snug
                  sm:text-4xl
                  sm:leading-[48px]
                  md:text-5xl
                  md:leading-[64px]
                  lg:text-[64px]
                  lg:leading-[101px]

                  bg-gradient-to-r from-white to-[#BCBCBC]
                  bg-clip-text text-transparent
                "
              >
                Build Smart AI Agents Visually
              </h1>

              <p
                className="
                  text-center font-inter font-medium
                  text-base       /* mobile smaller than heading */
                  leading-6
                  sm:text-lg
                  sm:leading-7
                  md:text-xl
                  md:leading-8
                  lg:text-[24px]
                  lg:leading-[37px]

                  tracking-[-0.0001em]
                  text-white/70
                  max-w-[790px] mx-auto
                "
              >
                Design conversation flows with drag-and-drop simplicity. Configure tools,
                deploy agents, and manage everything in one place.
              </p>


              </div>

      

             {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 items-center justify-center">
                <button 
                  onClick={() => router.push('/assistants')}
                  className="
                    group relative flex items-center justify-center gap-2.5 bg-[#13F584] 
                    hover:from-emerald-700 hover:to-green-700 
                    text-black px-4 py-4 rounded-full font-semibold 
                    transition-all duration-300 shadow-lg shadow-emerald-600/20 
                    hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5
                  "
                >
                  <span>Get Started </span>
                </button>

              
              </div>


             
            </div>

        
          </div>
        </div>

       
      </section>

      {/* Features Section */}
      <section className="relative pb-20 via-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
          <h2
            className="
              mx-auto max-w-[841px]
              font-barlow font-semibold
              text-[40px] leading-[48px]
              lg:text-[56px] lg:leading-[64px]
              text-center mb-4
              bg-gradient-to-r from-white via-[#E8E8E8] to-[#BCBCBC]
              bg-clip-text text-transparent
              inline-block pb-1
            "
          >
            Everything You Need
          </h2>
           <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Build, configure, and deploy AI agents with our comprehensive platform
          </p>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
              
                title: 'Visual Flow Editor',
                description: 'Design conversation flows with intuitive drag-and-drop interface',
                
              },
              {
                
                title: 'Voice Intelligence',
                description: 'Natural conversations with advanced speech recognition',
         
              },
              {
               
                title: 'Smart Chat',
                description: 'Context-aware chatbots that understand and respond',
              
              },
              {
             
                title: 'Custom Tools',
                description: 'Integrate APIs and create custom functions easily',
               
              },
              {
           
                title: 'Multi-Channel',
                description: 'Deploy to web, mobile, phone, and messaging platforms',
          
              },
              {
              
                title: 'Analytics',
                description: 'Track performance and optimize agent interactions',
      
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                 className="
                    relative flex flex-col items-center 
                    p-4 gap-4 w-full h-full
                    bg-white/5 backdrop-blur-[10px]
                    rounded-[32px] overflow-hidden border border-transparent"             
                     style={{
                    backgroundImage: `
                      url('/images/card1.svg'),
                      radial-gradient(
                        circle at top left,
                        rgba(19, 245, 132, 0.5) -105%, 
                        rgba(19, 245, 132, 0) 70%
                      )
                    `,
                    backgroundRepeat: "no-repeat, no-repeat",
                    backgroundPosition: "top left, top left",
                    backgroundSize: "auto, 150px 150px", // adjust glow size as needed
                  }}
                >
                      {/* Top-left glow effect */}
                      <div
                        className="absolute top-0 left-0 w-[220px] h-[220px] bg-[#13F584] opacity-50 blur-[1000px] rotate-[134deg] pointer-events-none"
                      ></div>
                       <Image
                        src="/images/Feature.svg"
                        alt="View Box"
                        width={400}  // optional, specify if not using fill
                        height={400} // optional, specify if not using fill
                      />
               
                <div className="w-full text-left">
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
     <section className="relative py-20 bg-[url('/images/visual-flow-editor-homepage.svg')] bg-cover bg-center overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2
              className="
                mx-auto max-w-[841px]
                font-barlow font-semibold
                text-[40px] leading-[48px]
                lg:text-[56px] lg:leading-[64px]
                text-center mb-4
                bg-gradient-to-r from-white via-[#E8E8E8] to-[#BCBCBC]
                bg-clip-text text-transparent
              "
            >
              Visual Flow Editor
            </h2>

           <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Design sophisticated conversation flows without writing code          </p>
          </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Single full image for desktop, positioned at the top of the grid */}
              <div className="hidden md:flex md:justify-center md:items-start md:absolute md:top-0 md:left-0 md:right-0 md:h-48 md:z-10">
                <Image
                  src="/images/visual-flow-editor-full.svg"
                  alt="Visual Flow Editor"
                  width={900}  // Keep or adjust for fit
                  height={200} // Reduced to fit within md:h-48
                />
              </div>
              
              {[
                {
                  image: '/images/create_assistant.svg',
                  width: 200,
                  height: 200,
                  title: 'Create Assistant',
                  description: 'Set up your AI agent with a name, description, and business context',
                },
                {
                  image: '/images/design_flows.svg',
                  width: 200,
                  height: 200,
                  title: 'Design Flows',
                  description: 'Use the visual editor to create conversation flows and connect tools',
                },
                {
                  image: '/images/deploy_test.svg',
                  width: 200,
                  height: 200,
                  title: 'Deploy & Test',
                  description: 'Launch your agent on voice or chat and start serving customers',
                }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Individual images only on mobile */}
                  <div className="flex justify-center mb-4 md:hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={item.width}
                      height={item.height}
                    />
                  </div>
                  
                  {/* Text section - pushed down on desktop to avoid overlap */}
                  <div className="w-full text-center md:mt-36">  {/* Added top margin on desktop */}
                    <h3 className="text-xl font-bold text-white mb-1 font-barlow font-semibold">{item.title}</h3>
                    <p className="text-white/70">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>



        </div>
      </section>
      
      {/* Use Cases Section */}
      <section className="relative mt-10 min-h-[850px]">
        {/* BACKGROUND SPOTLIGHT EFFECT: Bright center, dark edges */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(62.66% 66.69% at 50% 50%,  0%, rgba(115, 115, 115, 0) 74.84%)',
          }}
        />
        {/* Existing background gradient for the grid lines */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-50"
        />

        {/* Content Wrapper: Ensure content is above the background effects with z-index */}
        <div className="relative z-10 max-w-7xl mx-auto pt-10 pb-16">
            
          {/* Header */}
          <div className="relative max-w-7xl mx-auto text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-2">
              Built for Every Industry
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Customize AI agents for your specific business needs
            </p>
          </div>

          {/* Responsive Chessboard (the grid of cards) with radial mask for fade effect */}
          <div 
            className="relative max-w-7xl mx-auto flex flex-wrap justify-center gap-4 sm:gap-1 md:gap-0"
            style={{
              maskImage: 'radial-gradient(62.66% 66.69% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 74.84%)',
              WebkitMaskImage: 'radial-gradient(62.66% 66.69% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 74.84%)',
            }}
          >
            {/* ... (Your existing map logic for cards goes here) ... */}
            {Array.from({ length: 28 }).map((_, idx) => {
              const row = Math.floor(idx / 7);
              const col = idx % 7;
              const showCard = (row + col) % 2 !== 0;
              const isHiddenOnMobile = row === 3;

              if (showCard) {
                const cardData = cardsData[idx % cardsData.length];
                return (
                  <div
                    key={idx}
                    // Added z-20 to ensure cards are above the new background layer
                    className={`relative z-20 w-[155px] sm:w-[140px] h-[158px] sm:h-[140px] p-4  flex flex-col justify-center items-center
                                bg-[rgba(19,245,132,0.04)] border border-[rgba(145,158,171,0.12)]
                                transition cursor-pointer hover:bg-[rgba(19,245,132,0.08)] m-[0px]
                                ${isHiddenOnMobile ? "hidden sm:flex" : "flex"}`}
                  >
                    
                    {/* SVG Icon Top-Right */}
                    <div className="absolute top-2 left-2 w-6 h-6">
                    
                  <div className="absolute top-2 left-2 w-6 h-6">
                      <svg width="35" height="35" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="61.5177" height="61.5177" rx="30.7589" fill="white" fill-opacity="0.04"/>
                        <rect x="0.768971" y="0.768971" width="59.9798" height="59.9798" rx="29.9899" stroke="#919EAB" stroke-opacity="0.32" stroke-width="1.53794"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M25.0851 30.3C25.9461 30.5046 26.7672 30.8448 27.522 31.3098L29.1059 30.6056L30.9715 32.4712L30.2699 34.0551C30.735 34.8098 31.0751 35.631 31.2798 36.4947L32.8956 37.1166V39.7556L31.2798 40.3774C31.0751 41.2384 30.7323 42.0597 30.2699 42.8144L30.9715 44.3983L29.1059 46.2639L27.522 45.5623C26.7699 46.0273 25.9461 46.3675 25.0851 46.5722L24.4631 48.1879H21.8243L21.2023 46.5722C20.3386 46.3675 19.5175 46.0247 18.7627 45.5623L17.1788 46.2639L15.3132 44.3983L16.0175 42.8144C15.5524 42.0623 15.2123 41.2384 15.005 40.3774L13.3892 39.7556V37.1166L15.005 36.4947C15.2123 35.631 15.5524 34.8098 16.0175 34.0551L15.3132 32.4712L17.1788 30.6056L18.7627 31.3098C19.5175 30.8448 20.3386 30.5046 21.1997 30.3L21.8243 28.6815H24.4631L25.0851 30.3ZM23.1424 33.8319C20.5991 33.8319 18.5395 35.8915 18.5395 38.4348C18.5395 40.978 20.5991 43.0403 23.1424 43.0403C25.6856 43.0403 27.7479 40.978 27.7479 38.4348C27.7479 35.8915 25.6856 33.8319 23.1424 33.8319ZM40.3181 15.067C41.1791 15.2716 42.0002 15.6118 42.755 16.0768L44.3389 15.3726L46.2045 17.2382L45.5029 18.8221C45.968 19.5768 46.3082 20.3981 46.5128 21.2618L48.1286 21.8836V24.5226L46.5128 25.1444C46.3082 26.0054 45.9653 26.8267 45.5029 27.5814L46.2045 29.1653L44.3389 31.0309L42.755 30.3293C42.0029 30.7943 41.1791 31.1346 40.3181 31.3392L39.6962 32.955H37.0572L36.4354 31.3392C35.5717 31.1346 34.7505 30.7917 33.9957 30.3293L32.4118 31.0309L30.5462 29.1653L31.2505 27.5814C30.7854 26.8293 30.4453 26.0054 30.2379 25.1444L28.6222 24.5226V21.8836L30.2379 21.2618C30.4453 20.3981 30.7854 19.5768 31.2505 18.8221L30.5462 17.2382L32.4118 15.3726L33.9957 16.0768C34.7505 15.6118 35.5716 15.2716 36.4327 15.067L37.0572 13.4485H39.6962L40.3181 15.067ZM38.3753 18.5988C35.8321 18.5988 33.7725 20.6585 33.7725 23.2017C33.7725 25.745 35.8321 27.8072 38.3753 27.8072C40.9186 27.8072 42.9809 25.745 42.9809 23.2017C42.9809 20.6585 40.9186 18.5988 38.3753 18.5988ZM28.9235 14.4956L28.8218 14.4698C28.5121 14.391 28.3245 14.0757 28.4032 13.766C28.4819 13.4563 28.7972 13.2687 29.107 13.3474L30.1941 13.6237C30.3946 13.6747 30.5527 13.8287 30.6088 14.0278L30.9131 15.1074C30.9998 15.415 30.8205 15.7351 30.5129 15.8217C30.2054 15.9084 29.8852 15.7291 29.7985 15.4216L29.7626 15.2938C27.8492 17.3764 26.6805 20.1536 26.6805 23.2017C26.6805 24.3768 26.8541 25.5116 27.1771 26.582C27.2694 26.8879 27.096 27.2112 26.7901 27.3035C26.4842 27.3959 26.1609 27.2225 26.0685 26.9165C25.7135 25.7403 25.5225 24.4932 25.5225 23.2017C25.5225 19.8444 26.8125 16.786 28.9235 14.4956ZM33.9089 33.8638L33.8654 33.9291C33.6885 34.1952 33.3288 34.2675 33.0627 34.0906C32.7966 33.9136 32.7243 33.5539 32.9013 33.2878L33.5225 32.3538C33.637 32.1817 33.8348 32.0836 34.0412 32.0967L35.1606 32.1677C35.4796 32.188 35.722 32.4633 35.7019 32.7822C35.6816 33.1011 35.4063 33.3436 35.0873 33.3234L34.9328 33.3136C35.6161 34.883 35.9953 36.615 35.9953 38.4348C35.9953 41.5497 34.8848 44.4072 33.0386 46.6329C32.8345 46.8789 32.4692 46.9129 32.2233 46.7089C31.9774 46.5049 31.9433 46.1396 32.1473 45.8936C33.827 43.8687 34.8373 41.2687 34.8373 38.4348C34.8373 36.8132 34.5066 35.2682 33.9089 33.8638Z" fill="white"/>
                      </svg>

                  </div>
                    </div> 

                    {/* Card Text */}
                    <div className="text-white font-semibold text-[18px] text-center leading-[22px] mt-6">
                      {cardData.title}
                    </div>
                    <div className="text-[#919EAB] text-[12px] text-center leading-[16px]">
                        {cardData.subtitle}
                      </div>
                  </div>
                );
              } else {
                // Empty card matching the grid lines specifications
                return (
                  <div
                    key={idx}
                    className={`w-[155px] sm:w-[140px] h-[158px] sm:h-[140px] border m-[0px] hidden sm:block`}
                    style={{ borderColor: '#565656', borderWidth: '1.04956px' }}
                  />
                );
              }
            })}
          </div>

          {/* CTA */}
          <div className="relative z-10 flex justify-center mt-0" style={{ left: '0px', top: '10px' }}>
          <button 
                    onClick={() => router.push('/assistants')}
                    className="
                      group relative flex items-center justify-center gap-2.5 bg-[#13F584] 
                      hover:from-emerald-700 hover:to-green-700 
                      text-black px-4 py-4 rounded-full font-semibold 
                      transition-all duration-300 shadow-lg shadow-emerald-600/20 
                      hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5
                    "
                  >
                    <span>Get Started </span>
                  </button>
          </div>
        </div>
      </section>

      {/* Flow Editor Showcase */}
      <section className="relative mt-10 py-20  overflow-hidden">
     
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="text-center mb-2">
          
            <h2
              className="
                mx-auto max-w-[841px]
                font-barlow font-semibold
                text-[40px] leading-[48px]
                lg:text-[56px] lg:leading-[64px]
                text-center mb-2
                bg-gradient-to-r from-white via-[#E8E8E8] to-[#BCBCBC]
                bg-clip-text text-transparent
              "
            >
              How It Works
            </h2>
             <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Get your AI agent up and running in minutes            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative md:pt-96">

              {/* Single full image for desktop, positioned at the top of the grid */}
              <div className="hidden md:flex md:justify-center md:items-start md:absolute md:top-0 md:left-0 md:right-0 md:h-48 md:z-10 ">
                <Image
                  src="/images/flow-editor-showcase.svg"
                  alt="Visual Flow Editor"
                  width={900}  // Keep or adjust for fit
                  height={200} // Reduced to fit within md:h-48
                />
              </div>
              
              {[
                {
                  image: '/images/drag-drop.svg',
                  width: 250,
                  height: 250,
                 
                },
                {
                  image: '/images/organize-tools.svg',
                  width: 250,
                  height: 250,
                 
                },
                {
                  image: '/images/control-flow.svg',
                  width: 250,
                  height: 250,
                 
                }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Individual images only on mobile */}
                  <div className="flex justify-center mb-4 md:hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={item.width}
                      height={item.height}
                    />
                  </div>
                  
               
                </div>
              ))}
            </div>

        

          <div className="text-center mt-44">
            <button
              onClick={() => router.push('/assistants')}
              className="inline-flex items-center px-4 py-4 bg-[#13F584] hover:from-emerald-700 hover:to-green-700 text-black font-semibold rounded-full shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5"
            >
                  Get Started
            </button>
          
          </div>
        </div>
      </section>

      

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
      
<section className="bg-[url('/images/footer.svg')] bg-cover bg-center bg-no-repeat border-t border-white/20 flex flex-col md:flex-row justify-center items-start p-9 gap-6 z-50">
  {/* Left Group: Navigation */}
  <div className="flex flex-col justify-between items-end gap-64 w-full md:w-[396px] h-auto md:h-[328px]">
    <div className="flex flex-col items-start gap-4 w-full">
      <h4 className="text-xs font-normal text-white/40 font-poppins">Navigation</h4>
      <div className="flex flex-row items-start gap-18">
        <ul className="flex flex-col items-start gap-1.5 text-xs font-normal text-white font-poppins">
          <li><a href="/">Home</a></li>
          <li><a href="/assistants">Product</a></li>
          <li><a href="/service">Service</a></li>
          <li><a href="/about">About Us</a></li>
        </ul>
      </div>
    </div>
  </div>

  {/* Right Group: Contact, Social, Location */}
  <div className="flex flex-col justify-between items-start w-full md:w-[564px] h-auto md:h-[328px]">
    <div className="flex flex-col items-start gap-8 w-full">
      {/* Contact Section */}
      <div className="flex flex-row justify-between items-start gap-34 w-full">
        <div className="flex flex-col justify-between items-start gap-4 w-full">
          <h4 className="text-xs font-normal text-white/40 font-poppins">Contact us</h4>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-[96px]">
            <ul className="flex flex-col items-start gap-1 text-xs font-normal text-white/80 font-poppins">
              <li>+1 (406) 555-0120</li>
              <li>+1 (480) 555-0103</li>
            </ul>
            <p className="text-xs font-normal text-white/80 font-poppins">
              help@promptverse.com
            </p>
          </div>
        </div>
      </div>

      {/* Social and Chat Sections */}
      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-36 w-full">
        {/* Follow Us */}
        <div className="flex flex-col items-start gap-4 w-full md:w-[127.5px]">
          <h4 className="text-xs font-normal text-white/40 font-poppins">Follow us</h4>
          <div className="flex flex-row justify-center items-center gap-2">
            <button className="w-9.5 h-9.5  rounded-full flex items-center justify-center">
             
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.375" y="0.375" width="36.75" height="36.75" rx="18.375" stroke="white" stroke-opacity="0.25" stroke-width="0.75"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M23.25 12.75H14.25C13.4227 12.75 12.75 13.4227 12.75 14.25V23.25C12.75 24.0773 13.4227 24.75 14.25 24.75H18.75V20.625H17.25V18.75H18.75V17.25C18.75 16.6533 18.9871 16.081 19.409 15.659C19.831 15.2371 20.4033 15 21 15H22.5V16.875H21.75C21.336 16.875 21 16.836 21 17.25V18.75H22.875L22.125 20.625H21V24.75H23.25C24.0773 24.75 24.75 24.0773 24.75 23.25V14.25C24.75 13.4227 24.0773 12.75 23.25 12.75Z" fill="white"/>
                </svg>

            
            </button>
            <button className="w-9.5 h-9.5 rounded-full flex items-center justify-center">
           <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.375" y="0.375" width="36.75" height="36.75" rx="18.375" stroke="white" stroke-opacity="0.25" stroke-width="0.75"/>
            <path d="M18.75 13.8343C20.3404 13.8343 20.5572 13.8343 21.2078 13.8343C21.7861 13.8343 22.0753 13.9789 22.2922 14.0512C22.5813 14.1958 22.7982 14.2681 23.0151 14.4849C23.2319 14.7018 23.3765 14.9187 23.4488 15.2078C23.5211 15.4247 23.5934 15.7139 23.6657 16.2922C23.6657 16.9428 23.6657 17.0873 23.6657 18.75C23.6657 20.4127 23.6657 20.5572 23.6657 21.2078C23.6657 21.7861 23.5211 22.0753 23.4488 22.2922C23.3042 22.5813 23.2319 22.7982 23.0151 23.0151C22.7982 23.2319 22.5813 23.3765 22.2922 23.4488C22.0753 23.5211 21.7861 23.5934 21.2078 23.6657C20.5572 23.6657 20.4127 23.6657 18.75 23.6657C17.0873 23.6657 16.9428 23.6657 16.2922 23.6657C15.7139 23.6657 15.4247 23.5211 15.2078 23.4488C14.9187 23.3042 14.7018 23.2319 14.4849 23.0151C14.2681 22.7982 14.1235 22.5813 14.0512 22.2922C13.9789 22.0753 13.9066 21.7861 13.8343 21.2078C13.8343 20.5572 13.8343 20.4127 13.8343 18.75C13.8343 17.0873 13.8343 16.9428 13.8343 16.2922C13.8343 15.7139 13.9789 15.4247 14.0512 15.2078C14.1958 14.9187 14.2681 14.7018 14.4849 14.4849C14.7018 14.2681 14.9187 14.1235 15.2078 14.0512C15.4247 13.9789 15.7139 13.9066 16.2922 13.8343C16.9428 13.8343 17.1596 13.8343 18.75 13.8343ZM18.75 12.75C17.0873 12.75 16.9428 12.75 16.2922 12.75C15.6416 12.75 15.2078 12.8946 14.8464 13.0392C14.4849 13.1837 14.1235 13.4006 13.762 13.762C13.4006 14.1235 13.256 14.4127 13.0392 14.8464C12.8946 15.2078 12.8223 15.6416 12.75 16.2922C12.75 16.9428 12.75 17.1596 12.75 18.75C12.75 20.4127 12.75 20.5572 12.75 21.2078C12.75 21.8584 12.8946 22.2922 13.0392 22.6536C13.1837 23.0151 13.4006 23.3765 13.762 23.738C14.1235 24.0994 14.4127 24.244 14.8464 24.4608C15.2078 24.6054 15.6416 24.6777 16.2922 24.75C16.9428 24.75 17.1596 24.75 18.75 24.75C20.3404 24.75 20.5572 24.75 21.2078 24.75C21.8584 24.75 22.2922 24.6054 22.6536 24.4608C23.0151 24.3163 23.3765 24.0994 23.738 23.738C24.0994 23.3765 24.244 23.0874 24.4608 22.6536C24.6054 22.2922 24.6777 21.8584 24.75 21.2078C24.75 20.5572 24.75 20.3404 24.75 18.75C24.75 17.1596 24.75 16.9428 24.75 16.2922C24.75 15.6416 24.6054 15.2078 24.4608 14.8464C24.3163 14.4849 24.0994 14.1235 23.738 13.762C23.3765 13.4006 23.0874 13.256 22.6536 13.0392C22.2922 12.8946 21.8584 12.8223 21.2078 12.75C20.5572 12.75 20.4127 12.75 18.75 12.75Z" fill="white"/>
            <path d="M18.75 15.6416C17.0151 15.6416 15.6416 17.0151 15.6416 18.75C15.6416 20.4849 17.0151 21.8584 18.75 21.8584C20.4849 21.8584 21.8584 20.4849 21.8584 18.75C21.8584 17.0151 20.4849 15.6416 18.75 15.6416ZM18.75 20.7741C17.6657 20.7741 16.7259 19.9066 16.7259 18.75C16.7259 17.6657 17.5934 16.7259 18.75 16.7259C19.8343 16.7259 20.7741 17.5934 20.7741 18.75C20.7741 19.8343 19.8343 20.7741 18.75 20.7741Z" fill="white"/>
            <path d="M21.9307 16.2922C22.33 16.2922 22.6536 15.9685 22.6536 15.5693C22.6536 15.17 22.33 14.8464 21.9307 14.8464C21.5315 14.8464 21.2078 15.17 21.2078 15.5693C21.2078 15.9685 21.5315 16.2922 21.9307 16.2922Z" fill="white"/>
            </svg>

            </button>
            <button className="w-9.5 h-9.5  rounded-full flex items-center justify-center">
             <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.375" y="0.375" width="36.75" height="36.75" rx="18.375" stroke="white" stroke-opacity="0.25" stroke-width="0.75"/>
            <path d="M26.5875 14.5714C26.3813 13.8214 25.8656 13.2857 25.1438 13.0714C23.9063 12.75 18.6469 12.75 18.6469 12.75C18.6469 12.75 13.4906 12.75 12.15 13.0714C11.4281 13.2857 10.9125 13.8214 10.7062 14.5714C10.5 15.9643 10.5 18.75 10.5 18.75C10.5 18.75 10.5 21.5357 10.8094 22.9286C11.0156 23.6786 11.5312 24.2143 12.2531 24.4286C13.4906 24.75 18.75 24.75 18.75 24.75C18.75 24.75 23.9062 24.75 25.2469 24.4286C25.9687 24.2143 26.4844 23.6786 26.6906 22.9286C27 21.5357 27 18.75 27 18.75C27 18.75 27 15.9643 26.5875 14.5714ZM17.1 21.3214V16.1786L21.4313 18.75L17.1 21.3214Z" fill="white"/>
            </svg>

            </button>
          </div>
        </div>

        {/* Let’s Chat */}
        <div className="flex flex-col items-start gap-4 w-full md:w-[127.5px]">
          <h4 className="text-xs font-normal text-white/40 font-poppins">Let’s chat</h4>
          <div className="flex flex-row justify-center items-center gap-2">
            <button className="w-9.5 h-9.5  rounded-full flex items-center justify-center">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.375" y="0.375" width="36.75" height="36.75" rx="18.375" stroke="white" stroke-opacity="0.25" stroke-width="0.75"/>
              <path d="M25.198 15.2456L25.194 15.23C24.8683 13.9562 23.4 12.5893 22.0516 12.3049L22.0364 12.3019C19.8555 11.8994 17.6441 11.8994 15.4636 12.3019L15.4479 12.3049C14.1 12.5893 12.6317 13.9562 12.3056 15.23L12.302 15.2456C11.8993 17.0245 11.8993 18.8286 12.302 20.6075L12.3056 20.6231C12.6178 21.8425 13.9767 23.1466 15.2748 23.5053V24.9272C15.2748 25.4418 15.923 25.6946 16.2917 25.3232L17.7808 23.8257C18.1037 23.8432 18.4269 23.8529 18.75 23.8529C19.8479 23.8529 20.9462 23.7525 22.0364 23.5512L22.0516 23.5482C23.4 23.2638 24.8683 21.8969 25.194 20.6231L25.198 20.6075C25.6007 18.8286 25.6007 17.0245 25.198 15.2456ZM24.0196 20.3495C23.8022 21.1806 22.6874 22.2137 21.8015 22.4046C20.6419 22.6179 19.4731 22.7091 18.3054 22.6779C18.2822 22.6772 18.2599 22.6859 18.2437 22.702C18.078 22.8666 17.1564 23.7819 17.1564 23.7819L16 24.9302C15.9154 25.0154 15.7669 24.9574 15.7669 24.8397V22.4842C15.7669 22.4453 15.7382 22.4122 15.6987 22.4047C15.6989 22.4047 15.6985 22.4047 15.6987 22.4047C14.8129 22.2138 13.6978 21.1805 13.4799 20.3495C13.1175 18.7415 13.1175 17.1115 13.4799 15.5035C13.6978 14.6725 14.8122 13.6393 15.698 13.4484C17.7233 13.0758 19.7767 13.0758 21.8015 13.4484C22.6878 13.6393 23.8022 14.6725 24.0196 15.5035C24.3824 17.1115 24.3824 18.7416 24.0196 20.3495Z" fill="white"/>
              <path d="M20.6765 21.4368C20.5403 21.3968 20.4105 21.37 20.29 21.3216C19.0411 20.8203 17.8917 20.1735 16.9813 19.1821C16.4635 18.6184 16.0583 17.9819 15.7157 17.3083C15.5533 16.9889 15.4164 16.657 15.2769 16.3272C15.1496 16.0265 15.337 15.7158 15.5344 15.4892C15.7195 15.2765 15.9578 15.1138 16.2159 14.9938C16.4173 14.9002 16.6159 14.9542 16.763 15.1194C17.081 15.4765 17.3731 15.8518 17.6097 16.2657C17.7551 16.5203 17.7152 16.8315 17.4516 17.0048C17.3875 17.0469 17.3291 17.0963 17.2695 17.1439C17.2171 17.1856 17.1679 17.2277 17.132 17.2841C17.0664 17.3874 17.0633 17.5092 17.1055 17.6215C17.4306 18.4857 17.9785 19.1578 18.8776 19.5198C19.0215 19.5777 19.166 19.6451 19.3317 19.6264C19.6093 19.595 19.6992 19.3005 19.8937 19.1465C20.0839 18.9961 20.3268 18.9942 20.5316 19.1195C20.7365 19.245 20.9351 19.3796 21.1325 19.5157C21.3262 19.6493 21.5191 19.78 21.6979 19.9322C21.8697 20.0786 21.9289 20.2707 21.8321 20.4695C21.655 20.8334 21.3972 21.1361 21.0253 21.3294C20.9203 21.3839 20.7949 21.4015 20.6765 21.4368C20.7949 21.4015 20.5403 21.3968 20.6765 21.4368Z" fill="white"/>
              <path d="M18.7531 14.5777C20.3867 14.622 21.7284 15.6709 22.016 17.2334C22.0649 17.4997 22.0824 17.7719 22.1042 18.0421C22.1134 18.1557 22.0468 18.2637 21.92 18.2652C21.7891 18.2667 21.7302 18.1607 21.7217 18.0471C21.7049 17.8222 21.6932 17.5963 21.6611 17.3733C21.492 16.1959 20.5217 15.2219 19.3104 15.0129C19.1282 14.9814 18.9416 14.9731 18.757 14.9544C18.6403 14.9425 18.4874 14.9357 18.4615 14.7953C18.4398 14.6776 18.5425 14.5839 18.6583 14.5779C18.6898 14.5762 18.7215 14.5776 18.7531 14.5777C18.7215 14.5776 20.3867 14.622 18.7531 14.5777Z" fill="white"/>
              <path d="M21.2356 17.6913C21.2329 17.7111 21.2314 17.7575 21.2195 17.8012C21.1761 17.9599 20.9275 17.9797 20.8702 17.8196C20.8533 17.7721 20.8507 17.718 20.8506 17.6668C20.8501 17.3321 20.7749 16.9977 20.6004 16.7064C20.421 16.4071 20.147 16.1554 19.8256 16.0032C19.6313 15.9111 19.4211 15.8539 19.2081 15.8198C19.115 15.8049 19.0209 15.7958 18.9274 15.7832C18.814 15.768 18.7535 15.6981 18.7589 15.59C18.7639 15.4887 18.8404 15.4159 18.9545 15.4221C19.3293 15.4427 19.6915 15.5211 20.0247 15.6919C20.7025 16.0391 21.0897 16.5873 21.2027 17.3192C21.2078 17.3523 21.216 17.3852 21.2186 17.4185C21.225 17.5007 21.229 17.5829 21.2356 17.6913C21.229 17.5829 21.2329 17.7111 21.2356 17.6913Z" fill="white"/>
              <path d="M20.2196 17.6531C20.0829 17.6554 20.0098 17.5822 19.9957 17.461C19.9859 17.3765 19.9782 17.2908 19.9573 17.2086C19.9162 17.0466 19.8273 16.8965 19.6864 16.7973C19.6199 16.7504 19.5446 16.7162 19.4657 16.6942C19.3654 16.6662 19.2613 16.6739 19.1613 16.6502C19.0527 16.6244 18.9926 16.5393 19.0097 16.4407C19.0252 16.351 19.1154 16.281 19.2168 16.2881C19.8501 16.3323 20.3028 16.6491 20.3674 17.3705C20.3719 17.4214 20.3773 17.4752 20.3656 17.5239C20.3456 17.6072 20.2818 17.649 20.2196 17.6531C20.2818 17.649 20.0829 17.6554 20.2196 17.6531Z" fill="white"/>
              </svg>

            </button>
            <button className="w-9.5 h-9.5  rounded-full flex items-center justify-center">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.375" y="0.375" width="36.75" height="36.75" rx="18.375" stroke="white" stroke-opacity="0.25" stroke-width="0.75"/>
              <path d="M13.5749 18.0724C16.7962 16.6964 18.9441 15.7893 20.0189 15.351C23.0875 14.0997 23.7251 13.8823 24.1407 13.8751C24.2322 13.8736 24.4365 13.8958 24.5689 14.0011C24.6807 14.09 24.7115 14.2102 24.7262 14.2945C24.7409 14.3788 24.7592 14.5709 24.7447 14.7209C24.5784 16.4339 23.8588 20.5909 23.4928 22.5095C23.3379 23.3213 23.0329 23.5935 22.7376 23.6202C22.096 23.6781 21.6087 23.2044 20.9872 22.805C20.0147 22.18 19.4653 21.7909 18.5213 21.181C17.4303 20.4762 18.1375 20.0888 18.7593 19.4557C18.922 19.29 21.7492 16.7688 21.8039 16.5401C21.8108 16.5115 21.8171 16.4048 21.7525 16.3485C21.6879 16.2922 21.5926 16.3115 21.5238 16.3268C21.4262 16.3485 19.8726 17.3553 16.8629 19.3471C16.4219 19.644 16.0225 19.7886 15.6646 19.781C15.2701 19.7727 14.5112 19.5623 13.947 19.3825C13.255 19.162 12.705 19.0454 12.7529 18.6709C12.7779 18.4758 13.0519 18.2763 13.5749 18.0724Z" fill="white"/>
              </svg>

            </button>
            <button className="w-9.5 h-9.5  rounded-full flex items-center justify-center">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.375" y="0.375" width="36.75" height="36.75" rx="18.375" stroke="white" stroke-opacity="0.25" stroke-width="0.75"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M23.475 13.9406C22.2094 12.675 20.5219 12 18.75 12C15.0375 12 12 15.0375 12 18.75C12 19.9312 12.3375 21.1125 12.9281 22.125L12 25.5L15.5438 24.5719C16.5563 25.0781 17.6531 25.4156 18.75 25.4156C22.4625 25.4156 25.5 22.3781 25.5 18.6656C25.5 16.8937 24.7406 15.2063 23.475 13.9406ZM18.75 24.3188C17.7375 24.3188 16.725 24.0656 15.8813 23.5594L15.7125 23.475L13.6031 24.0656L14.1938 22.0406L14.025 21.7875C13.4344 20.8594 13.1812 19.8469 13.1812 18.8344C13.1812 15.7969 15.7125 13.2656 18.75 13.2656C20.2687 13.2656 21.6188 13.8562 22.7156 14.8687C23.8125 15.9656 24.3188 17.3156 24.3188 18.8344C24.3188 21.7875 21.8719 24.3188 18.75 24.3188ZM21.7875 20.1C21.6188 20.0156 20.775 19.5938 20.6063 19.5938C20.4375 19.5094 20.3531 19.5094 20.2687 19.6781C20.1844 19.8469 19.8469 20.1844 19.7625 20.3531C19.6781 20.4375 19.5937 20.4375 19.425 20.4375C19.2562 20.3531 18.75 20.1844 18.075 19.5938C17.5688 19.1719 17.2313 18.5813 17.1469 18.4125C17.0625 18.2438 17.1469 18.1594 17.2313 18.075C17.3156 17.9906 17.4 17.9062 17.4844 17.8219C17.5688 17.7375 17.5688 17.6531 17.6531 17.5688C17.7375 17.4844 17.6531 17.4 17.6531 17.3156C17.6531 17.2313 17.3156 16.3875 17.1469 16.05C17.0625 15.7969 16.8938 15.7969 16.8094 15.7969C16.725 15.7969 16.6406 15.7969 16.4719 15.7969C16.3875 15.7969 16.2187 15.7969 16.05 15.9656C15.8812 16.1344 15.4594 16.5562 15.4594 17.4C15.4594 18.2437 16.05 19.0031 16.1344 19.1719C16.2187 19.2563 17.3156 21.0281 19.0031 21.7031C20.4375 22.2937 20.6906 22.125 21.0281 22.125C21.3656 22.125 22.0406 21.7031 22.125 21.3656C22.2938 20.9438 22.2938 20.6063 22.2094 20.6063C22.125 20.1844 21.9563 20.1844 21.7875 20.1Z" fill="white"/>
              </svg>

            </button>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col items-start gap-4 w-[239px]">
        <h4 className="text-xs font-normal text-white/40 font-inter">Location</h4>
        <p className="text-xs font-normal text-white/80 font-poppins">2972 Westheimer Rd. Santa Ana, Illinois 85486</p>
      </div>
    </div>

    {/* Bottom: Copyright and Language */}
    <div className="flex flex-col items-start gap-1 text-xs font-normal text-white/40 font-poppins">
      <div className="flex flex-row justify-center items-center gap-104 w-full">
        <p className="text-xs font-normal text-white/40 font-poppins">© 2024 — esap.ai</p>
      </div>
      Copyright Privacy All rights reserved
    </div>
  </div>
</section>


    </div>
    
  );
};

export default HeroSection;