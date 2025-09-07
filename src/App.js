import React, { useState } from 'react';

// 簡化版UI組件
const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-800 border border-gray-600 rounded-lg ${className}`} style={{backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: 'rgba(75, 85, 99, 0.3)'}}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="p-6 pb-0">{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-xl font-semibold text-white ${className}`}>{children}</h3>
);

const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

const Button = ({ children, onClick, className = "", disabled = false }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

const Input = ({ type = "text", value, onChange, placeholder, className = "", min, max }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    max={max}
    className={`w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
    style={{backgroundColor: '#374151', borderColor: '#4B5563'}}
  />
);

function BaccaratPredictor() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ userId: '', password: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [startAmount, setStartAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isSetup, setIsSetup] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [currentGame, setCurrentGame] = useState({
    playerCards: ['', '', ''],
    bankerCards: ['', '', ''],
    playerPoints: '',
    bankerPoints: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [winRate, setWinRate] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  // 數據對照表
  const RC_VALUES = {
    1: 5, 2: 5, 3: -3, 4: -3, 5: -3, 6: -3, 7: -1, 8: -1, 9: -1,
    10: 0, 11: 0, 12: 0, 13: 0
  };

  const PW_VALUES = {
    0: 0.1, 1: 0.9, 2: 0.5, 3: 0.5, 4: 0.6, 5: 0.7,
    6: 0.3, 7: 0.6, 8: 0.2, 9: 0.1
  };

  const DP_VALUES = {
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 2,
    10: 3, 11: 3, 12: 3, 13: 3
  };

  const BANKER_PV_VALUES = {
    0: 1.5, 1: 1.5, 2: 1.5, 3: 1.5, 4: 1.5, 5: 1.5,
    6: 1.5, 7: 1.7, 8: 1.7, 9: 1.7
  };

  const PLAYER_PV_VALUES = {
    0: 1.4, 1: 1.4, 2: 1.2, 3: 1.2, 4: 1.4, 5: 1.2,
    6: 1.2, 7: 1.6, 8: 1.6, 9: 1.6
  };

  const mockUsers = {
    'user123': { password: 'ABC123', points: 1500, name: 'TestUser' },
    'user456': { password: 'DEF456', points: 3000, name: 'VIPUser' }
  };

  const handleLogin = () => {
    const user = mockUsers[loginForm.userId];
    if (user && user.password === loginForm.password) {
      setCurrentUser({
        id: loginForm.userId,
        ...user
      });
      setIsLoggedIn(true);
    } else {
      alert('賬號或密碼錯誤，請重試');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsSetup(false);
    setLoginForm({ userId: '', password: '' });
    resetSystem();
  };

  const deductPoints = () => {
    if (currentUser.points >= 5) {
      setCurrentUser(prev => ({
        ...prev,
        points: prev.points - 5
      }));
      return true;
    }
    return false;
  };

  const calculateEA = (playerCards, bankerCards, playerPoints, bankerPoints) => {
    const playerRC = playerCards.reduce((sum, card) => sum + (RC_VALUES[parseInt(card)] || 0), 0);
    const bankerRC = bankerCards.reduce((sum, card) => sum + (RC_VALUES[parseInt(card)] || 0), 0);
    const TC = playerRC + bankerRC;

    const playerEA = TC * (PW_VALUES[parseInt(playerPoints)] || 0);
    const bankerEA = TC * (PW_VALUES[parseInt(bankerPoints)] || 0);

    return { playerEA, bankerEA };
  };

  const calculateVP = (playerCards, bankerCards, playerPoints, bankerPoints) => {
    const playerDP = playerCards.reduce((sum, card) => sum + (DP_VALUES[parseInt(card)] || 0), 0);
    const bankerDP = bankerCards.reduce((sum, card) => sum + (DP_VALUES[parseInt(card)] || 0), 0);

    const playerVP = playerDP / (PLAYER_PV_VALUES[parseInt(playerPoints)] || 1);
    const bankerVP = bankerDP / (BANKER_PV_VALUES[parseInt(bankerPoints)] || 1);

    return { playerVP, bankerVP };
  };

  const analyzePrediction = () => {
    if (currentUser.points < 5) {
      alert('積分不足！每次預測需要消耗5XP，請聯繫管理員充值。');
      return;
    }

    const { playerCards, bankerCards, playerPoints, bankerPoints } = currentGame;
    
    const allCards = [...playerCards, ...bankerCards];
    if (allCards.some(card => !card || parseInt(card) < 0 || parseInt(card) > 13)) {
      alert('請輸入有效的牌值 (1-13)');
      return;
    }
    
    if (!playerPoints || !bankerPoints ||
        parseInt(playerPoints) < 0 || parseInt(playerPoints) > 9 ||
        parseInt(bankerPoints) < 0 || parseInt(bankerPoints) > 9) {
      alert('請輸入有效的點數 (0-9)');
      return;
    }

    if (!deductPoints()) {
      alert('積分扣除失敗，請重試');
      return;
    }

    const { playerEA, bankerEA } = calculateEA(playerCards, bankerCards, playerPoints, bankerPoints);
    const { playerVP, bankerVP } = calculateVP(playerCards, bankerCards, playerPoints, bankerPoints);

    const isNatural = parseInt(playerPoints) >= 8 || parseInt(bankerPoints) >= 8;
    
    let recommendation = '';
    let probability = 0;
    let betAmount = 0;
    let analysisReason = '';
    
    if (Math.abs(playerEA - bankerEA) < 0.1) {
      if (playerVP > bankerVP) {
        recommendation = isNatural ? 'PLAYER' : 'BANKER';
        probability = isNatural ? 75 : 65;
        analysisReason = `EA值接近，VP值閒家較高，${isNatural ? '天生局面偏向閒家' : '常規局面建議莊家'}`;
      } else {
        recommendation = isNatural ? 'BANKER' : 'PLAYER';
        probability = isNatural ? 75 : 65;
        analysisReason = `EA值接近，VP值莊家較高，${isNatural ? '天生局面偏向莊家' : '常規局面建議閒家'}`;
      }
    } else if ((playerEA > bankerEA && playerVP > bankerVP) ||
               (playerEA < bankerEA && playerVP < bankerVP)) {
      if (playerEA > bankerEA) {
        recommendation = isNatural ? 'BANKER' : 'PLAYER';
        probability = isNatural ? 80 : 70;
        analysisReason = `EA和VP值同時偏向閒家，${isNatural ? '天生局反向投注莊家' : '建議投注閒家'}`;
      } else {
        recommendation = isNatural ? 'PLAYER' : 'BANKER';
        probability = isNatural ? 80 : 70;
        analysisReason = `EA和VP值同時偏向莊家，${isNatural ? '天生局反向投注閒家' : '建議投注莊家'}`;
      }
    } else {
      recommendation = 'OBSERVE';
      probability = 50;
      analysisReason = 'EA值與VP值指向不同，建議觀望等待更好時機';
    }

    if (recommendation !== 'OBSERVE') {
      const edge = (probability - 50) / 100;
      const kellyPercent = Math.max(0.01, Math.min(0.05, edge * 2));
      betAmount = Math.round(currentAmount * kellyPercent);
      betAmount = Math.max(100, Math.min(betAmount, currentAmount * 0.1));
    }

    setPrediction({
      recommendation,
      probability,
      betAmount,
      playerEA: playerEA.toFixed(2),
      bankerEA: bankerEA.toFixed(2),
      playerVP: playerVP.toFixed(2),
      bankerVP: bankerVP.toFixed(2),
      isNatural,
      analysisReason
    });
  };

  const confirmResult = (actualResult) => {
    if (!prediction) return;

    const isCorrect = prediction.recommendation === actualResult ||
                     (prediction.recommendation === 'OBSERVE' && actualResult === 'OBSERVE');
    
    let profit = 0;
    if (prediction.recommendation !== 'OBSERVE' && actualResult !== 'OBSERVE') {
      if (isCorrect) {
        profit = actualResult === 'BANKER' ?
                Math.round(prediction.betAmount * 0.95) :
                prediction.betAmount;
      } else {
        profit = -prediction.betAmount;
      }
    }

    const newAmount = currentAmount + profit;
    setCurrentAmount(newAmount);

    const newGame = {
      ...currentGame,
      prediction: prediction,
      result: actualResult,
      profit: profit,
      isCorrect: isCorrect,
      timestamp: new Date().toLocaleTimeString()
    };

    setGameHistory(prev => [...prev, newGame]);
    setTotalGames(prev => prev + 1);
    
    if (actualResult !== 'OBSERVE') {
      setWinRate(() => {
        const total = totalGames + 1;
        const wins = gameHistory.filter(g => g.isCorrect).length + (isCorrect ? 1 : 0);
        return Math.round((wins / total) * 100);
      });
    }

    setCurrentGame({
      playerCards: ['', '', ''],
      bankerCards: ['', '', ''],
      playerPoints: '',
      bankerPoints: ''
    });
    setPrediction(null);
  };

  const resetSystem = () => {
    setGameHistory([]);
    setCurrentGame({
      playerCards: ['', '', ''],
      bankerCards: ['', '', ''],
      playerPoints: '',
      bankerPoints: ''
    });
    setPrediction(null);
    setWinRate(0);
    setTotalGames(0);
    setStartAmount('');
    setTargetAmount('');
    setCurrentAmount(0);
  };

  const handleSetup = () => {
    if (!startAmount || !targetAmount || parseFloat(startAmount) <= 0 || parseFloat(targetAmount) <= parseFloat(startAmount)) {
      alert('請輸入有效的起始資金和目標資金');
      return;
    }
    setCurrentAmount(parseFloat(startAmount));
    setIsSetup(true);
  };

  if (!isLoggedIn) {
    return (
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937, #7c3aed, #8b5cf6)', padding: '24px'}}>
        <div style={{maxWidth: '400px', margin: '80px auto'}}>
          <Card>
            <CardHeader>
              <CardTitle style={{textAlign: 'center', fontSize: '28px', marginBottom: '8px'}}>
                百家樂預測器
              </CardTitle>
              <p style={{color: '#d1d5db', textAlign: 'center'}}>AI Agent分析預測</p>
            </CardHeader>
            <CardContent>
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', color: '#d1d5db', marginBottom: '8px'}}>
                  用戶ID
                </label>
                <Input
                  type="text"
                  value={loginForm.userId}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, userId: e.target.value }))}
                  placeholder="請輸入用戶ID"
                />
              </div>
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', color: '#d1d5db', marginBottom: '8px'}}>
                  密碼
                </label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="請輸入密碼"
                />
              </div>
              <Button onClick={handleLogin} style={{width: '100%'}}>
                登入系統
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isSetup) {
    return (
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937, #7c3aed, #8b5cf6)', padding: '24px'}}>
        <div style={{maxWidth: '400px', margin: '40px auto'}}>
          <Card style={{marginBottom: '24px'}}>
            <CardContent>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <p style={{color: 'white', fontWeight: 'bold'}}>{currentUser.name}</p>
                  <p style={{color: '#d1d5db', fontSize: '14px'}}>ID: {currentUser.id}</p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{color: '#fbbf24', fontWeight: 'bold'}}>{currentUser.points} XP</div>
                  <Button onClick={handleLogout} style={{marginTop: '8px', fontSize: '12px', background: '#dc2626'}}>
                    登出
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle style={{textAlign: 'center'}}>設置投注資金</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', color: '#d1d5db', marginBottom: '8px'}}>
                  起始資金 (元)
                </label>
                <Input
                  type="number"
                  value={startAmount}
                  onChange={(e) => setStartAmount(e.target.value)}
                  placeholder="請輸入起始資金"
                />
              </div>
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', color: '#d1d5db', marginBottom: '8px'}}>
                  目標資金 (元)
                </label>
                <Input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="請輸入目標資金"
                />
              </div>
              <Button onClick={handleSetup} style={{width: '100%'}}>
                開始分析
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentAmount - parseFloat(startAmount)) / (parseFloat(targetAmount) - parseFloat(startAmount))) * 100;

  return (
    <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937, #7c3aed, #8b5cf6)', padding: '16px'}}>
      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        
        {/* 用戶狀態欄 */}
        <Card style={{marginBottom: '24px'}}>
          <CardContent>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <p style={{color: 'white', fontWeight: 'bold'}}>{currentUser.name}</p>
                <p style={{color: '#d1d5db'}}>ID: {currentUser.id}</p>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
                <span style={{color: '#fbbf24', fontWeight: 'bold', fontSize: '18px'}}>{currentUser.points} XP</span>
                <Button onClick={handleLogout} style={{background: '#dc2626'}}>
                  登出
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 資金狀態 */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px'}}>
          <Card>
            <CardContent>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>當前資金</p>
                  <p style={{color: '#10b981', fontSize: '24px', fontWeight: 'bold'}}>
                    ${currentAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>目標資金</p>
                  <p style={{color: '#3b82f6', fontSize: '24px', fontWeight: 'bold'}}>
                    ${parseFloat(targetAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>勝率</p>
                  <p style={{color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold'}}>{winRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>進度</p>
                  <p style={{color: '#fbbf24', fontSize: '24px', fontWeight: 'bold'}}>
                    {Math.max(0, Math.min(100, progressPercentage)).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 積分提示 */}
        <Card style={{marginBottom: '24px', backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.3)'}}>
          <CardContent>
            <div style={{textAlign: 'center', color: '#fbbf24'}}>
              每次預測消耗 5 XP • 剩餘可預測次數: {Math.floor(currentUser.points / 5)} 次
            </div>
          </CardContent>
        </Card>

        {/* 輸入區域 */}
        <Card style={{marginBottom: '24px'}}>
          <CardHeader>
            <CardTitle>牌局輸入</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px'}}>
              <div>
                <h3 style={{color: '#a855f7', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px'}}>閒家 (Player)</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px'}}>
                  {currentGame.playerCards.map((card, index) => (
                    <Input
                      key={`player-${index}`}
                      type="number"
                      min="1"
                      max="13"
                      value={card}
                      onChange={(e) => {
                        const newCards = [...currentGame.playerCards];
                        newCards[index] = e.target.value;
                        setCurrentGame(prev => ({...prev, playerCards: newCards}));
                      }}
                      placeholder={`牌${index + 1}`}
                      style={{textAlign: 'center'}}
                    />
                  ))}
                </div>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={currentGame.playerPoints}
                  onChange={(e) => setCurrentGame(prev => ({...prev, playerPoints: e.target.value}))}
                  placeholder="閒家點數 (0-9)"
                />
              </div>

              <div>
                <h3 style={{color: '#f97316', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px'}}>莊家 (Banker)</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px'}}>
                  {currentGame.bankerCards.map((card, index) => (
                    <Input
                      key={`banker-${index}`}
                      type="number"
                      min="1"
                      max="13"
                      value={card}
                      onChange={(e) => {
                        const newCards = [...currentGame.bankerCards];
                        newCards[index] = e.target.value;
                        setCurrentGame(prev => ({...prev, bankerCards: newCards}));
                      }}
                      placeholder={`牌${index + 1}`}
                      style={{textAlign: 'center'}}
                    />
                  ))}
                </div>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={currentGame.bankerPoints}
                  onChange={(e) => setCurrentGame(prev => ({...prev, bankerPoints: e.target.value}))}
                  placeholder="莊家點數 (0-9)"
                />
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'center', gap: '16px'}}>
              <Button
                onClick={analyzePrediction}
                disabled={currentUser.points < 5}
                style={{padding: '12px 32px', fontSize: '16px'}}
              >
                {currentUser.points < 5 ? '積分不足' : '分析預測 (-5 XP)'}
              </Button>
              <Button
                onClick={() => {
                  setCurrentGame({
                    playerCards: ['', '', ''],
                    bankerCards: ['', '', ''],
                    playerPoints: '',
                    bankerPoints: ''
                  });
                  setPrediction(null);
                  setGameHistory([]);
                  setWinRate(0);
                  setTotalGames(0);
                }}
                style={{padding: '12px 24px', fontSize: '16px', background: '#f97316'}}
              >
                重新計算
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 預測結果 */}
        {prediction && (
          <Card style={{marginBottom: '24px', borderColor: '#10b981'}}>
            <CardHeader>
              <CardTitle style={{color: '#10b981'}}>AI預測結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px'}}>
                <div style={{textAlign: 'center', padding: '16px', backgroundColor: 'rgba(55, 65, 81, 0.5)', borderRadius: '8px'}}>
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>建議投注</p>
                  <p style={{
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: prediction.recommendation === 'PLAYER' ? '#a855f7' : 
                           prediction.recommendation === 'BANKER' ? '#f97316' : '#9ca3af'
                  }}>
                    {prediction.recommendation === 'PLAYER' ? '閒家' :
                     prediction.recommendation === 'BANKER' ? '莊家' : '觀望'}
                  </p>
                </div>
                <div style={{textAlign: 'center', padding: '16px', backgroundColor: 'rgba(55, 65, 81, 0.5)', borderRadius: '8px'}}>
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>勝率預測</p>
                  <p style={{fontSize: '24px', fontWeight: 'bold', color: '#10b981'}}>{prediction.probability}%</p>
                </div>
                <div style={{textAlign: 'center', padding: '16px', backgroundColor: 'rgba(55, 65, 81, 0.5)', borderRadius: '8px'}}>
                  <p style={{color: '#9ca3af', fontSize: '14px'}}>建議金額</p>
                  <p style={{fontSize: '24px', fontWeight: 'bold', color: '#fbbf24'}}>
                    ${prediction.betAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px'}}>
                <div style={{textAlign: 'center'}}>
                  <p style={{color: '#9ca3af'}}>閒家EA</p>
                  <p style={{color: '#a855f7', fontWeight: 'bold'}}>{prediction.playerEA}</p>
                </div>
                <div style={{textAlign: 'center'}}>
                  <p style={{color: '#9ca3af'}}>莊家EA</p>
                  <p style={{color: '#f97316', fontWeight: 'bold'}}>{prediction.bankerEA}</p>
                </div>
                <div style={{textAlign: 'center'}}>
                  <p style={{color: '#9ca3af'}}>閒家VP</p>
                  <p style={{color: '#a855f7', fontWeight: 'bold'}}>{prediction.playerVP}</p>
                </div>
                <div style={{textAlign: 'center'}}>
                  <p style={{color: '#9ca3af'}}>莊家VP</p>
                  <p style={{color: '#f97316', fontWeight: 'bold'}}>{prediction.bankerVP}</p>
                </div>
              </div>

              <div style={{backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px'}}>
                <p style={{color: '#93c5fd', fontSize: '14px'}}>
                  <span style={{fontWeight: 'bold'}}>分析依據: </span>
                  {prediction.analysisReason}
                </p>
              </div>

              {prediction.isNatural && (
                <div style={{backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px'}}>
                  <p style={{color: '#fbbf24', textAlign: 'center', fontWeight: 'bold'}}>
                    ⚡ 天生贏家局面 - 提高預測準確度
                  </p>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'center', gap: '16px'}}>
                <Button
                  onClick={() => confirmResult('PLAYER')}
                  style={{background: '#a855f7'}}
                >
                  閒家贏
                </Button>
                <Button
                  onClick={() => confirmResult('BANKER')}
                  style={{background: '#f97316'}}
                >
                  莊家贏
                </Button>
                <Button
                  onClick={() => confirmResult('TIE')}
                  style={{background: '#6b7280'}}
                >
                  和局
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 歷史記錄 */}
        {gameHistory.length > 0 && (
          <Card style={{marginBottom: '24px'}}>
            <CardHeader>
              <CardTitle>遊戲記錄</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{maxHeight: '240px', overflowY: 'auto'}}>
                {gameHistory.slice(-10).map((game, index) => (
                  <div key={index} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(55, 65, 81, 0.5)', borderRadius: '8px', marginBottom: '8px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <span style={{color: '#9ca3af', fontSize: '14px'}}>{game.timestamp}</span>
                      <span style={{
                        fontWeight: 'bold',
                        color: game.prediction.recommendation === 'PLAYER' ? '#a855f7' :
                               game.prediction.recommendation === 'BANKER' ? '#f97316' : '#9ca3af'
                      }}>
                        預測: {game.prediction.recommendation === 'PLAYER' ? '閒家' :
                               game.prediction.recommendation === 'BANKER' ? '莊家' : '觀望'}
                      </span>
                      <span style={{color: 'white'}}>
                        結果: {game.result === 'PLAYER' ? '閒家' :
                               game.result === 'BANKER' ? '莊家' : '和局'}
                      </span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <span style={{
                        fontWeight: 'bold',
                        color: game.profit > 0 ? '#10b981' : game.profit < 0 ? '#ef4444' : '#9ca3af'
                      }}>
                        {game.profit > 0 ? '+' : ''}${game.profit.toLocaleString()}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: game.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: game.isCorrect ? '#10b981' : '#ef4444'
                      }}>
                        {game.isCorrect ? '✓' : '✗'}
                      </span>
                      <span style={{color: '#fbbf24', fontSize: '14px'}}>-5 XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 控制按鈕 */}
        <div style={{display: 'flex', justifyContent: 'center', gap: '16px'}}>
          <Button
            onClick={() => setIsSetup(false)}
            style={{padding: '12px 32px', background: '#3b82f6'}}
          >
            重設資金
          </Button>
          <Button
            onClick={handleLogout}
            style={{padding: '12px 32px', background: '#dc2626'}}
          >
            登出系統
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BaccaratPredictor;
