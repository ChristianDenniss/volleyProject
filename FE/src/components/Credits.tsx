import React from "react";
import "../styles/Credits.css";

// Import your images as modules
import LuvLateAvatar from "../images/LuvLate.png";
// import ArticKitsuuAvatar from "../images/ArticKitsuu.png";
import IlloultAvatar from "../images/Illoult.png";
// import capitandeAvatar from "../images/capitande.png";
import stenimatedAvatar from "../images/stenimated.png";

const CreditsPage: React.FC = () => {
  return (
    <div className="credits-container">
      <h1 className="credits-header">Our Contributors</h1>
      <p className="credits-subtitle">
        The folks who brought this project to life
      </p>

      <div className="credits-grid">
        <div className="credit-card">
          <img
            src={LuvLateAvatar}
            alt="LuvLate"
            className="credit-avatar"
          />
          <h3 className="credit-name">LuvLate</h3>
          <p className="credit-role">Project Lead</p>
        </div>

        <div className="credit-card">
          <img
            src={stenimatedAvatar}
            alt="stenimated"
            className="credit-avatar"
          />
          <h3 className="credit-name">Stenimated</h3>
          <p className="credit-role">Systems & Deployment Engineer</p>
        </div>

        <div className="credit-card">
          <img
            src={LuvLateAvatar}
            alt="LuvLate"
            className="credit-avatar"
          />
          <h3 className="credit-name">LuvLate</h3>
          <p className="credit-role">Fullstack Engineer</p>
        </div>

        <div className="credit-card">
          <img
            src={IlloultAvatar}
            alt="Illoult"
            className="credit-avatar"
          />
          <h3 className="credit-name">Illoult</h3>
          <p className="credit-role">Graphic Designer</p>
        </div>
        
      </div>
    </div>
  );
};

export default CreditsPage;
