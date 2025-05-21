import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // Use Routes instead of Switch
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import About from "./components/About";
import Header from "./components/Header";
import Teams from "./components/Teams"; // Import Teams component
import SingleTeam from "./components/SingleTeam"; // Import SingleTeam component
import Games from "./components/Games"; // Import Games component
import Players from "./components/Players"; // Import Players component
import Seasons from "./components/Seasons"; // Import Seasons component
import Articles from "./components/Article"; // Import Articles component
import PrivacyPolicy from "./components/PrivacyPolicy"; // Import PrivacyPolicy component
import SingleGame from "./components/SingleGame";
import SingleSeason from "./components/SingleSeason";
import Contact from "./components/ContactUs";
import Credits from "./components/Credits";
import SingleArticle from "./components/SingleArticle";

const App: React.FC = () => {
  return (
    <Router>
      <Header /> {/* Displayed above navbar */}
      <Navbar />
      <div className="main-content"> {/* Main content wrapper */}
        <Routes>
          {/* Define routes for each component */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/players" element={<Players />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/games/:id" element={<SingleGame />} />
          <Route path="/teams/:teamName" element={<SingleTeam />} />
          <Route path="/seasons" element={<Seasons />} />
          <Route path="/seasons/:id" element={<SingleSeason />} />
          <Route path="/games" element={<Games />} />
          <Route path="/articles" element={<Articles />} />
          <Route path = "/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/articles/:id" element={<SingleArticle />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
};

export default App;
