// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";

import Header from "./components/Header";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import UserProfile from "./components/UserProfile";
import SignUp from "./components/SignUp";
import Home from "./components/Home";
import About from "./components/About";
import Players from "./components/Players";
import Teams from "./components/Teams";
import SingleTeam from "./components/SingleTeam";
import Games from "./components/Games";
import SingleGame from "./components/SingleGame";
import Seasons from "./components/Seasons";
import SingleSeason from "./components/SingleSeason";
import Articles from "./components/Article";
import SingleArticle from "./components/SingleArticle";
import Contact from "./components/ContactUs";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Credits from "./components/Credits";

// import your page-based Login instead of the old component
import LoginPage from "./components/Login";

const App: React.FC = () =>
{
    return (
        <AuthProvider>
            <Router>
                <Header /> {/* Displayed above navbar */}
                <Navbar />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/players" element={<Players />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/teams/:teamName" element={<SingleTeam />} />
                        <Route path="/games" element={<Games />} />
                        <Route path="/games/:id" element={<SingleGame />} />
                        <Route path="/seasons" element={<Seasons />} />
                        <Route path="/seasons/:id" element={<SingleSeason />} />
                        <Route path="/articles" element={<Articles />} />
                        <Route path="/articles/:id" element={<SingleArticle />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/credits" element={<Credits />} />

                        <Route path="/profile" element={<UserProfile />} />

                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignUp />} />
                    </Routes>
                </div>
                <Footer />
            </Router>
        </AuthProvider>
    );
};

export default App;
