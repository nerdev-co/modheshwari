import { Routes, Route } from "react-router-dom";
import { Providers } from "../app/providers";
import { LocaleProvider } from "../lib/LocaleContext";
import ThemeInitializer from "../app/themeInitializer";
import NavBar from "../components/NavBar";

import Home from "../app/page";
import SignIn from "../app/signin/page";
import SignUp from "../app/signup/page";
import SignUpFH from "../app/signup/fh/page";
import SignUpFM from "../app/signup/fm/page";
import Profile from "../app/me/page";
import ProfileEdit from "../app/me/edit/page";
import Family from "../app/family/page";
import FamilyTree from "../app/family/tree/page";
import Events from "../app/events/page";
import EventDetail from "../app/events/[id]/page";
import EventCreate from "../app/events/create/page";
import EventCalendar from "../app/events/calendar/page";
import Medical from "../app/medical/page";
import MedicalRecords from "../app/medical/records/page";
import Resources from "../app/resources/page";
import Nearby from "../app/nearby/page";
import Chat from "../app/chat/page";
import Notifications from "../app/notifications/page";
import AdminNotifications from "../app/admin/notifications/page";
import Search from "../app/search/page";
import Contact from "../app/contact/page";
import Spec from "../app/spec/page";
import Privacy from "../app/privacy/page";
import NotAuthenticated from "../app/notAuthenticated/page";

export default function App() {
  return (
    <Providers>
      <LocaleProvider>
        <ThemeInitializer />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[10001] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-jewel-900 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          Skip to content
        </a>
        <NavBar />
        <main id="main-content" className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signup/fh" element={<SignUpFH />} />
            <Route path="/signup/fm" element={<SignUpFM />} />
            <Route path="/me" element={<Profile />} />
            <Route path="/me/edit" element={<ProfileEdit />} />
            <Route path="/family" element={<Family />} />
            <Route path="/family/tree" element={<FamilyTree />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/create" element={<EventCreate />} />
            <Route path="/events/calendar" element={<EventCalendar />} />
            <Route path="/medical" element={<Medical />} />
            <Route path="/medical/records" element={<MedicalRecords />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/nearby" element={<Nearby />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/spec" element={<Spec />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/notAuthenticated" element={<NotAuthenticated />} />
          </Routes>
        </main>
      </LocaleProvider>
    </Providers>
  );
}
