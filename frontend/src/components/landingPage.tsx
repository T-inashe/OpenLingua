import { useEffect, useState } from "react";
import config from "../config";

const menus = ['Home', 'About', 'Service', 'Contact']

const LandingPage = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true); 
    }, []);




    const handleGoogleLogin = () => {
        try {
          window.location.href = `${config.BACKEND_URL}/api/auth/google`;
        } catch (err) {
          console.error('Google login error:', err);
        }
      };
    
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">

        <header className={`relative z-50 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="container px-6 py-6">
                <div className="font-bold flex items-center justify-between">
                    <div className=" text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-400 bg-clip-text text-transparent">
                        OpenLingua
                    </div>
                    <div className="hidden md:flex space-x-8">
                        {
                            menus.map((item: string, index: number) => {
                            return (
                                <a
                                    className={`text-gray-300 hover:text-white transition-all duration-300 hover:scale-100 ${isVisible? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                                    key={item}
                                    style={{transitionDelay: `${index*100}ms`}}
                                    href="a">
                                    {item}
                                </a>
                            )
                            })
                        }
                    </div>
                    <button onClick={handleGoogleLogin} className={`bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 transform ${isVisible? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        Sign In
                    </button>

                  
                </div>
            </div>


        </header>
<<<<<<< HEAD
        <section className="relataive container mx-auto z-20 px-10 py-20">
            <div className="text-center">
                <h1 className={`text-6xl md:text-8xl font-bold mb-8 transition-all duration-1400 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                    <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                        Diversity
                    </span>
                    <br/>
                    <span className="text-white">is Now</span>
                </h1>
                <p className={`text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto transition-all duration-1200 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>Learn a new language at your own pace </p>
                <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                    <button onClick={handleGoogleLogin} className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transitoin-all duration-300 hover: scale-110 tranform hover:-translate-y-1">Start Your Journey</button>
                    <button className="border-2 border-gray-400 text-gray-300 px-8 py-4 rounded-full text-lg font-semibold hover: border-white hover:text-white hover:shadow-xl transitionall duration-300 hover:scale-110 transform">Watch Demo</button>
=======
        <section className="relative container mx-auto z-20 px-10 py-20">
            <div className="text-center">
                <h1 className={`text-6xl md:text-8xl font-bold mb-8 transition-all duration-1500 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                    <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                        Diversity
                    </span>
                    <br />
                    <span className="text-white">is Now</span>
                </h1>
                <p className={`text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto transition-all duration-1100 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    Learn a new language at your own pace
                </p>
                <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                    <button onClick={handleGoogleLogin} className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110 transform hover:-translate-y-1">
                        Start Your Journey
                    </button>
                    <button className="border-2 border-gray-400 text-gray-300 px-8 py-4 rounded-full text-lg font-semibold hover:border-white hover:text-white hover:shadow-xl transition-all duration-300 hover:scale-110 transform">
                        Watch Demo
                    </button>
>>>>>>> main
                </div>
            </div>
        </section>

<<<<<<< HEAD
=======

>>>>>>> main
    </div>
  )
}

<<<<<<< HEAD
export default LandingPage
=======
export default LandingPage
>>>>>>> main
