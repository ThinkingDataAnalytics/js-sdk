import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function PageB() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="App">
      <h1>Page B</h1>
      <button onClick={handleBack}>返回上一页</button>
    </div>
  );
}

export default PageB;

