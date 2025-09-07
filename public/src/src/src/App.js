import React, { useState, useEffect } from 'react';
// 在 App.js 頂部添加這些簡單組件
const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-800/50 border border-gray-600 rounded-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="p-6 pb-0">{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, className = "", disabled = false, variant = "" }) => {
  const baseClass = "px-4 py-2 rounded-md font-medium transition-colors";
  const variantClass = variant === "outline" ? "border border-gray-500 bg-transparent" : "bg-purple-600 hover:bg-purple-700";
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Input = ({ type = "text", value, onChange, placeholder, className = "", min, max }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    max={max}
    className={`w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
  />
);
import { AlertCircle, TrendingUp, DollarSign, Target, BarChart3, User, Lock, Star } from 'lucide-react';

const BaccaratPredictor = () => {
  // 登錄狀態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ userId: '', password: '' });
  const [currentUser, setCurrentUser] = useState(null);
  
  // 原有狀態
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
  const [trendData, setTrendData] = useState([]);

  // RC值對照表
  const RC_VALUES = {
    1: 5, 2: 5, 3: -3, 4: -3, 5: -3, 6: -3, 7: -1, 8: -1, 9: -1,
    10: 0, 11: 0, 12: 0, 13: 0
  };

  // PW值對照表
  const PW_VALUES = {
    0: 0.1, 1: 0.9, 2: 0.5, 3: 0.5, 4: 0.6, 5: 0.7,
    6: 0.3, 7: 0.6, 8: 0.2, 9: 0.1
  };

  // DP值對照表
  const DP_VALUES = {
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 2,
    10: 3, 11: 3, 12: 3, 13: 3
  };

  // 莊家PV值對照表
  const BANKER_PV_VALUES = {
    0: 1.5, 1: 1.5, 2: 1.5, 3: 1.5, 4: 1.5, 5: 1.5,
    6: 1.5, 7: 1.7, 8: 1.7, 9: 1.7
  };

  // 閒家PV值對照表
  const PLAYER_PV_VALUES = {
    0: 1.4, 1: 1.4, 2: 1.2, 3: 1.2, 4: 1.4, 5: 1.2,
    6: 1.2, 7: 1.6, 8: 1.6, 9: 1.6
  };

  // 模擬用戶數據庫
  const mockUsers = {
    'user123': { password: 'ABC123', points: 1500, name: 'TestUser' },
    'user456': { password: 'DEF456', points: 3000, name: 'VIPUser' }
  };

  // 登錄處理
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

  // 登出處理
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsSetup(false);
    setLoginForm({ userId: '', password: '' });
    resetSystem();
  };

  // 扣除積分
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

    return { playerEA, bankerEA, TC };
  };

  const calculateVP = (playerCards, bankerCards, playerPoints, bankerPoints) => {
    const playerDP = playerCards.reduce((sum, card) => sum + (DP_VALUES[parseInt(card)] || 0), 0);
    const bankerDP = bankerCards.reduce((sum, card) => sum + (DP_VALUES[parseInt(card)] || 0), 0);

    const playerVP = playerDP / (PLAYER_PV_VALUES[parseInt(playerPoints)] || 1);
    const bankerVP = bankerDP / (BANKER_PV_VALUES[parseInt(bankerPoints)] || 1);

    return { playerVP, bankerVP };
  };

  const analyzePrediction = () => {
    // 檢查積分
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

    // 扣除積分
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
      setWinRate(prev => {
        const total = totalGames + 1;
        const wins = gameHistory.filter(g => g.isCorrect).length + (isCorrect ? 1 : 0);
        return Math.round((wins / total) * 100);
      });
    }

    setTrendData(prev => [...prev, { amount: newAmount, timestamp: new Date().toLocaleTimeString() }]);

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
    setTrendData([]);
  };

  const handleSetup = () => {
    if (!startAmount || !targetAmount || parseFloat(startAmount) <= 0 || parseFloat(targetAmount) <= parseFloat(startAmount)) {
      alert('請輸入有效的起始資金和目標資金');
      return;
    }
    setCurrentAmount(parseFloat(startAmount));
    setIsSetup(true);
  };

  // 登錄界面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
        <div className="max-w-md mx-auto mt-20">
          <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                Probability Analyzer
              </CardTitle>
              <p className="text-gray-300 text-sm mt-2">AI Agent分析預測</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  用戶ID (系統自動填寫)
                </label>
                <Input
                  type="text"
                  value={loginForm.userId}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, userId: e.target.value }))}
                  className="bg-gray-700/50 border-purple-500/30 text-white"
                  placeholder="請輸入用戶ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  專屬編碼 (密碼)
                </label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-gray-700/50 border-purple-500/30 text-white"
                  placeholder="請輸入專屬編碼"
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                登入系統
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 資金設置界面
  if (!isSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
        <div className="max-w-md mx-auto mt-10">
          {/* 用戶信息欄 */}
          <Card className="bg-gray-800/50 border-green-500/30 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{currentUser.name}</p>
                    <p className="text-gray-300 text-sm">ID: {currentUser.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{currentUser.points} XP</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    登出
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                設置投注資金
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  起始資金 (元)
                </label>
                <Input
                  type="number"
                  value={startAmount}
                  onChange={(e) => setStartAmount(e.target.value)}
                  className="bg-gray-700/50 border-purple-500/30 text-white"
                  placeholder="請輸入起始資金"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  目標資金 (元)
                </label>
                <Input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="bg-gray-700/50 border-purple-500/30 text-white"
                  placeholder="請輸入目標資金"
                />
              </div>
              <Button
                onClick={handleSetup}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 用戶狀態欄 */}
        <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{currentUser.name}</p>
                  <p className="text-gray-300 text-sm">ID: {currentUser.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-lg">{currentUser.points} XP</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  登出
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 資金狀態 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">當前資金</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${currentAmount.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">目標資金</p>
                  <p className="text-2xl font-bold text-blue-400">
                    ${parseFloat(targetAmount).toLocaleString()}
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">勝率</p>
                  <p className="text-2xl font-bold text-purple-400">{winRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">進度</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {Math.max(0, Math.min(100, progressPercentage)).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 積分消耗提示 */}
        <Card className="bg-yellow-500/20 border-yellow-500/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-yellow-300">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">每次預測消耗 5 XP • 剩餘可預測次數: {Math.floor(currentUser.points / 5)} 次</span>
            </div>
          </CardContent>
        </Card>

        {/* 輸入區域 */}
        <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">牌局輸入</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-3">閒家 (Player)</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
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
                      className="bg-gray-700/50 border-purple-500/30 text-white text-center"
                      placeholder={`牌${index + 1}`}
                    />
                  ))}
                </div>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={currentGame.playerPoints}
                  onChange={(e) => setCurrentGame(prev => ({...prev, playerPoints: e.target.value}))}
                  className="bg-gray-700/50 border-purple-500/30 text-white"
                  placeholder="閒家點數 (0-9)"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-orange-300 mb-3">莊家 (Banker)</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
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
                      className="bg-gray-700/50 border-orange-500/30 text-white text-center"
                      placeholder={`牌${index + 1}`}
                    />
                  ))}
                </div>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={currentGame.bankerPoints}
                  onChange={(e) => setCurrentGame(prev => ({...prev, bankerPoints: e.target.value}))}
                  className="bg-gray-700/50 border-orange-500/30 text-white"
                  placeholder="莊家點數 (0-9)"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={analyzePrediction}
                disabled={currentUser.points < 5}
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3 text-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {currentUser.points < 5 ? '積分不足' : '分析預測 (-5 XP)'}
              </Button>
              <Button
                onClick={() => {
                  // 清除當前遊戲輸入
                  setCurrentGame({
                    playerCards: ['', '', ''],
                    bankerCards: ['', '', ''],
                    playerPoints: '',
                    bankerPoints: ''
                  });
                  // 清除預測結果
                  setPrediction(null);
                  // 清除歷史記錄
                  setGameHistory([]);
                  setWinRate(0);
                  setTotalGames(0);
                  setTrendData([]);
                }}
                className="bg-orange-600 hover:bg-orange-700 px-6 py-3 text-lg"
                variant="outline"
              >
                重新計算
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 預測結果 */}
        {prediction && (
          <Card className="bg-gray-800/50 border-green-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-green-400" />
                AI預測結果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">建議投注</p>
                  <p className={`text-2xl font-bold ${
                    prediction.recommendation === 'PLAYER' ? 'text-purple-400' :
                    prediction.recommendation === 'BANKER' ? 'text-orange-400' : 'text-gray-400'
                  }`}>
                    {prediction.recommendation === 'PLAYER' ? '閒家' :
                     prediction.recommendation === 'BANKER' ? '莊家' : '觀望'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">勝率預測</p>
                  <p className="text-2xl font-bold text-green-400">{prediction.probability}%</p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">建議金額</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    ${prediction.betAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-400">閒家EA</p>
                  <p className="text-purple-400 font-bold">{prediction.playerEA}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">莊家EA</p>
                  <p className="text-orange-400 font-bold">{prediction.bankerEA}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">閒家VP</p>
                  <p className="text-purple-400 font-bold">{prediction.playerVP}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">莊家VP</p>
                  <p className="text-orange-400 font-bold">{prediction.bankerVP}</p>
                </div>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">分析依據: </span>
                  {prediction.analysisReason}
                </p>
              </div>

              {prediction.isNatural && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-300 text-center font-semibold">
                    ⚡ 天生贏家局面 - 提高預測準確度
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => confirmResult('PLAYER')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  閒家贏
                </Button>
                <Button
                  onClick={() => confirmResult('BANKER')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  莊家贏
                </Button>
                <Button
                  onClick={() => confirmResult('TIE')}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  和局
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 歷史記錄 */}
        {gameHistory.length > 0 && (
          <Card className="bg-gray-800/50 border-blue-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">遊戲記錄</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {gameHistory.slice(-10).map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm">{game.timestamp}</span>
                      <span className={`font-semibold ${
                        game.prediction.recommendation === 'PLAYER' ? 'text-purple-400' :
                        game.prediction.recommendation === 'BANKER' ? 'text-orange-400' : 'text-gray-400'
                      }`}>
                        預測: {game.prediction.recommendation === 'PLAYER' ? '閒家' :
                               game.prediction.recommendation === 'BANKER' ? '莊家' : '觀望'}
                      </span>
                      <span className="text-white">
                        結果: {game.result === 'PLAYER' ? '閒家' :
                               game.result === 'BANKER' ? '莊家' : '和局'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${game.profit > 0 ? 'text-green-400' : game.profit < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {game.profit > 0 ? '+' : ''}${game.profit.toLocaleString()}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${game.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {game.isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-yellow-400 text-sm">-5 XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 控制按鈕 */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setIsSetup(false)}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            重設資金
          </Button>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-8 py-3"
          >
            登出系統
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BaccaratPredictor;
