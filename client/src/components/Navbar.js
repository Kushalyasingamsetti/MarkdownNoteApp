// import React from "react";

// const Navbar = () => {
//   return (
//     <nav className="navbar navbar-dark bg-dark mb-4">
//       <div className="container">
//         <span className="navbar-brand mb-0 h1">📝 Markdown Note App</span>
//       </div>
//       <button className="btn btn-sm btn-outline-light" onClick={toggleTheme}>
//         Toggle Dark Mode
//       </button>

//     </nav>
//   );
// };

// export default Navbar;

import React from 'react';

const Navbar = ({ toggleTheme, isDark }) => {
  return (
    <nav className={`navbar navbar-expand-lg ${isDark ? 'navbar-dark bg-dark' : 'navbar-light bg-light'}`}>
      <div className="container">
        <a className="navbar-brand" href="#">Markdown Note App</a>
        <button className="btn btn-sm btn-outline-info" onClick={toggleTheme}>
          {isDark ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
