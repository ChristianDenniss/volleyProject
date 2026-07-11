// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { RegionProvider } from "./context/regionContext";
import ViewportLayoutSync from "./components/ViewportLayoutSync";
import Header         from "./components/Header";
import Navbar         from "./components/NavBar";
import Footer         from "./components/Footer";
import PrivateRoute   from "./components/portal/PrivateRoute";      // ← NEW import

// Route-level code splitting: each page (and its exclusive dependencies, e.g. three.js
// for VectorGraphPage) only downloads when a visitor actually navigates to it.
const Applications      = lazy(() => import("./components/Applications"));
const UserProfile       = lazy(() => import("./components/UserProfile"));
const SignUp            = lazy(() => import("./components/SignUp"));
const Home              = lazy(() => import("./components/Home"));
const About             = lazy(() => import("./components/About"));
const Players           = lazy(() => import("./components/Players"));
const Awards            = lazy(() => import("./components/Awards"));
const Teams             = lazy(() => import("./components/Teams"));
const SingleTeam        = lazy(() => import("./components/Single/SingleTeam"));
const Games             = lazy(() => import("./components/Games"));
const SingleGame        = lazy(() => import("./components/Single/SingleGame"));
const Seasons           = lazy(() => import("./components/Seasons"));
const SingleSeason      = lazy(() => import("./components/Single/SingleSeason"));
const Articles          = lazy(() => import("./components/Article"));
const SingleArticle     = lazy(() => import("./components/Single/SingleArticle"));
const Contact           = lazy(() => import("./components/ContactUs"));
const PrivacyPolicy     = lazy(() => import("./components/PrivacyPolicy"));
const Credits           = lazy(() => import("./components/Credits"));
const SinglePlayer      = lazy(() => import("./components/Single/SinglePlayer"));
const PortalLayout      = lazy(() => import("./components/portal/PortalLayout"));
const Dashboard         = lazy(() => import("./components/portal/Dashboard"));
const UsersPage         = lazy(() => import("./components/portal/UsersPage"));
const PlayersPage       = lazy(() => import("./components/portal/PlayersPage"));
const TeamsPage         = lazy(() => import("./components/portal/TeamsPage"));
const SeasonsPage       = lazy(() => import("./components/portal/SeasonsPage"));
const GamesPage         = lazy(() => import("./components/portal/GamesPage"));
const StatsPage         = lazy(() => import("./components/portal/StatsPage"));
const SingleAward       = lazy(() => import("./components/Single/SingleAward"));
const LoginPage         = lazy(() => import("./components/Login"));
const AwardsPage        = lazy(() => import("./components/portal/AwardsPage"));
const CreateArticle     = lazy(() => import("./components/CreateArticle"));
const ArticlesPage      = lazy(() => import("./components/portal/ArticlesPage"));
const ApplicationsPage  = lazy(() => import("./components/portal/ApplicationsPage"));
const StatsLeaderboard  = lazy(() => import("./components/StatsLeaderboard"));
const FAQ               = lazy(() => import("./components/FAQ"));
const RecordsPage       = lazy(() => import("./components/RecordsPage"));
const TriviaPage        = lazy(() => import("./components/TriviaPage"));
const Schedules         = lazy(() => import("./components/Schedules"));
const VectorGraphPage   = lazy(() => import("./components/VectorGraphPage"));

const App: React.FC = () => (
  <AuthProvider>
    <Router>
    <RegionProvider>
    <ViewportLayoutSync />
      <Header />
      <Navbar />

      <div className="main-content">
        <Suspense fallback={<div className="page-loading" />}>
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
          <Route path="/stats" element={<StatsLeaderboard />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/trivia" element={<TriviaPage />} />
          <Route path="/vector-graph" element={<VectorGraphPage />} />

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
            <Route path="applications" element={<ApplicationsPage />} />
          </Route>
        </Routes>
        </Suspense>
      </div>

      <Footer />
    </RegionProvider>
    </Router>
  </AuthProvider>
);

export default App;
