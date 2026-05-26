import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SplashScreen from './pages/SplashScreen'
import IntroScreen from './pages/IntroScreen'
import AuthScreen from './pages/AuthScreen'
import SelectModeScreen from './pages/SelectModeScreen'
import ParentHomeScreen from './pages/ParentHomeScreen'
import ParentInterviewScreen from './pages/ParentInterviewScreen'
import ParentProgressScreen from './pages/ParentProgressScreen'
import ParentTranscriptScreen from './pages/ParentTranscriptScreen'
import ChildHomeScreen from './pages/ChildHomeScreen'
import ChildQuestionsScreen from './pages/ChildQuestionsScreen'
import ChildPhotosScreen from './pages/ChildPhotosScreen'
import ChildProgressScreen from './pages/ChildProgressScreen'
import ChildChaptersScreen from './pages/ChildChaptersScreen'
import MyPageScreen from './pages/MyPageScreen'
import CalendarScreen from './pages/CalendarScreen'
import ChatbotScreen from './pages/ChatbotScreen'
import AutobiographyScreen from './pages/AutobiographyScreen'
import { useScheduledCall } from './hooks/useScheduledCall'

function ScheduledCallMonitor() {
  useScheduledCall()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScheduledCallMonitor />
      <div className="mx-auto max-w-[390px] min-h-screen bg-[#F8F3EA]">
        <Routes>
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/intro" element={<IntroScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/select-mode" element={<SelectModeScreen />} />
          <Route path="/parent" element={<ParentHomeScreen />} />
          <Route path="/parent/interview" element={<ParentInterviewScreen />} />
          <Route path="/parent/progress" element={<ParentProgressScreen />} />
          <Route path="/parent/transcript" element={<ParentTranscriptScreen />} />
          <Route path="/child" element={<ChildHomeScreen />} />
          <Route path="/child/questions" element={<ChildQuestionsScreen />} />
          <Route path="/child/photos" element={<ChildPhotosScreen />} />
          <Route path="/child/progress" element={<ChildProgressScreen />} />
          <Route path="/child/chapters" element={<ChildChaptersScreen />} />
          <Route path="/mypage" element={<MyPageScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/child/chatbot" element={<ChatbotScreen />} />
          <Route path="/parent/autobiography" element={<AutobiographyScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
