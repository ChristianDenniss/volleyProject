// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";

import Header         from "./components/Header";
import Navbar         from "./components/NavBar";
import Footer         from "./components/Footer";
import UserProfile    from "./components/UserProfile";
import SignUp         from "./components/SignUp";
import Home           from "./components/Home";
import About          from "./components/About";
import Players        from "./components/Players";
import Awards         from "./components/Awards";
import Teams          from "./components/Teams";
import SingleTeam     from "./components/Single/SingleTeam";
import Games          from "./components/Games";
import SingleGame     from "./components/Single/SingleGame";
import Seasons        from "./components/Seasons";
import SingleSeason   from "./components/Single/SingleSeason";
import Articles       from "./components/Article";
import SingleArticle  from "./components/Single/SingleArticle";
import Contact        from "./components/ContactUs";
import PrivacyPolicy  from "./components/PrivacyPolicy";
import Credits        from "./components/Credits";
import SinglePlayer from "./components/Single/SinglePlayer";
import PortalLayout   from "./components/portal/PortalLayout";
import Dashboard      from "./components/portal/Dashboard";
import UsersPage      from "./components/portal/UsersPage";
import PlayersPage      from "./components/portal/PlayersPage";
import TeamsPage      from "./components/portal/TeamsPage";
import SeasonsPage      from "./components/portal/SeasonsPage";
import GamesPage from "./components/portal/GamesPage";
import StatsPage from "./components/portal/StatsPage";
import SingleAward from "./components/Single/SingleAward";
import LoginPage      from "./components/Login";
import PrivateRoute   from "./components/portal/PrivateRoute";      // ← NEW import
import AwardsPage   from "./components/portal/AwardsPage";  
import CreateArticle from "./components/CreateArticle";
import ArticlesPage from "./components/portal/ArticlesPage";

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <Header />
      <Navbar />

      <div className="main-content">
        <Routes>
          {/* public site */}
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
          <Route path="/players/:id" element={< SinglePlayer />}/>
          <Route path="/awards/:id" element={< SingleAward />}/>
          <Route path="/awards" element={<Awards />} />
          <Route path="/articles/create" element={<CreateArticle />} />

          {/* auth & profile */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUp />} />

          {/* ---------- Admin / Developer Portal ---------- */}
          <Route
            path="/portal"
            element={
              <PrivateRoute roles={["admin", "superadmin"]}>
                <PortalLayout />
              </PrivateRoute>
            }
          >
            {/* default landing inside portal */}
            <Route index element={<Dashboard />} />
            {/*entity management section */}
            <Route path="users" element={<UsersPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="awards" element={<AwardsPage />} />
            <Route path="articles" element={<ArticlesPage />} />

          </Route>
        </Routes>
      </div>

      <Footer />
    </Router>
  </AuthProvider>
);

export default App;
