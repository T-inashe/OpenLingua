import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const menus = ['Home', 'About', 'Testimonials', 'Contact']

const LandingPage = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTestimonial, setActivetestimonial] = useState(0)
    useEffect(() => {
        setIsVisible(true)
        const interval = setInterval(()=>{
            setActivetestimonial(prev => (prev + 1)%3)
        }, 4000);
        return () => clearInterval(interval)

    }, []);
    
    const languageCourses =[
        {
            title:"isiXhosa",
            description:"Master the clicks and the culture in one smooth journey.",
            icon:"🇿🇦",
            color: "from-purple-600 to-pink-600",
        },
        {
            title:"Shona",
            description:"Learn a language that sings history and unity.",
            icon:"🇿🇼",
            color: "from-purple-600 to-pink-600",
        },
        {
            title:"Swahili",
            description:"From 'Jambo' to fluent conversations - spoken by millions.",
            icon:"🇹🇿",
            color: "from-purple-600 to-pink-600",
        },
        {
            title:"Xitsonga",
            description:"Rhythmic, expressive, and full of heritage.",
            icon:"🇿🇦",
            color: "from-purple-600 to-pink-600",
        },
    ];
    const testimonials = [
        {
            name:"Nyeleti Mkhize",
            role:"Student",
            content:"Easy to use. It is a great platform to use to get to know the languages of my fellow colleagues.",
            avatar:"NM",
        },
        {
            name:"Sibabalwe Mhlontlo",
            role:"Community Member",
            content:"Amazing!!",
            avatar:"SM",
        },
        {
            name:"Shayniqua Karim",
            role:"CEO, Lifestyle Bar 089",
            content:"This app has helped me communicate with my clients in vernac, and that has helped bring a sense of home into our establishment",
            avatar: "SK",
        },
        
    ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">

        <header className={`relative z-50 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="container px-6 py-6">
                <div className="font-bold flex items-center justify-between">
                    <div className=" text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-400 bg-clip-text text-transparent">
                        OpenLingua
                    </div>
                    <div className="hidden md:flex space-x-8">
                        {menus.map((item: string, index: number) => {
                            let target = "#home";
                            if (item === "About") target = "#about";
                            if (item === "Testimonials") target = "#testimonials";
                            if (item === "Contact") target = "#contact";

                            return (
                            <a
                                key={item}
                                href={target}
                                className={`text-gray-300 hover:text-white transition-all duration-300 hover:scale-100 ${
                                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                }`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                {item}
                            </a>
                            );
                        })}
                    </div>
                    <Link to="/signIn">
                        <button className={`bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 transform ${isVisible? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                            Sign In
                        </button>
                    </Link>

                  
                </div>
            </div>


        </header>

        <section id= "home" className="relative container mx-auto z-20 px-10 py-20">
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
                    <Link to="signIn">
                        <button  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110 transform hover:-translate-y-1">
                            Start Your Journey
                        </button>
                    </Link>
                    <button className="border-2 border-gray-400 text-gray-300 px-8 py-4 rounded-full text-lg font-semibold hover:border-white hover:text-white hover:shadow-xl transition-all duration-300 hover:scale-110 transform">
                        Watch Demo
                    </button>

                </div>
            </div>
        </section >
        <section id ="about" className="relative container z-10 mx-auto px-10 py-20">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    About{" "}
                    <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Us
                    </span>
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                    OpenLingua provides you with the opportunity to teach your own language<br/>
                    and learn a different language at your own pace, we aim to achieve unity and embrace diversity in communities. 
                </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
                {
                    languageCourses.map((languageCourse: any, index: number) => (
                    <div
                        key={index}
                        style={{transitionDelay: `${index * 200}ms`}}
                        className={`group relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-purple-500/10 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
                        <div className={`absolute inset-0 bg-gradient-to-r ${languageCourse.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
                        <div className="relative z-10 text-center">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 emoji-flag">
                            {languageCourse.icon}
                        </div>
                        <div className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300">
                            {languageCourse.title}
                        </div>
                        <div className="text-gray-300 group-hover:text-gray-200 transition-colors duration-200">
                            {languageCourse.description}
                        </div>
                        </div>
                    </div>
                    ))
                }
            </div>

        </section>
        <section id="testimonials" className="container relative z-10 mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        What Our {" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Users Say</span>
                    </h2>
                </div>
                <div className="relative max-w-4xl mx-auto">
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10 overflow-hidden min-h-[250px]">
                    {testimonials.map((item, index) => (
                        <div
                            key={index}
                            className={`transition-all duration-500 ease-in-out ${
                            activeTestimonial === index
                                ? "opacity-100 translate-x-0 relative"
                                : "opacity-0 translate-x-full absolute"
                            }`}
                        >
                            <div className="text-center w-full">
                            <div className="text-2xl md:text-3xl text-gray-300 mb-8 leading-relaxed">
                                "{item.content}"
                            </div>
                            <div className="flex items-center justify-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {item.avatar}
                                </div>
                                <div className="text-left">
                                <div className="text-white font-semibold text-lg">{item.name}</div>
                                <div className="text-gray-400">{item.role}</div>
                                </div>
                            </div>
                            </div>
                        </div>
                    ))}
                </div>

                    <div className="flex justify-center mt-8 space-x-3">
                        {testimonials.map((_item: any, index: number) => (
                            <button
                                key={index}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${index == activeTestimonial ? 'bg-gradient-to-r from-cyan-400 to-purple-400': 'bg-gray-600 hover:bg-gray-500' }`}
                                onClick={() => setActivetestimonial(index)}
                            />
                        ))}


                    </div>
                </div>
        </section >
        <section id="contact" className="container relative z-10 mx-auto px-6 py-20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Contact Us</h2>
            <p className="text-gray-300">(084)-385-0923 | ttnashemanyara@gmail | h.nziweni@gmail.com | bongum2@gmail.com | nhlamulomabunda04@gmail.com</p>
            <p className="text-gray-300">&copy; 2025 OpenLingua. All rights reserved.</p>
        </section>

    </div>
  )
}
export default LandingPage