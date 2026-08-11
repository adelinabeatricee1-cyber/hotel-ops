export type Locale = "ro" | "en";

export interface Dictionary {
  nav: {
    dashboard: string;
    rooms: string;
    bookings: string;
    guests: string;
    housekeeping: string;
    staff: string;
    reports: string;
    parking: string;
    settings: string;
    logout: string;
  };
  dashboard: {
    welcome: string;
    summary: string;
    roomsHeading: string;
    tasksHeading: string;
    paymentsHeading: string;
    dueLabel: string;
    roomStatus: Record<"clean" | "dirty" | "inprogress" | "blocked", string>;
    taskStatus: Record<"todo" | "inprogress", string>;
  };
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    noAccount: string;
    createHotel: string;
    noProfileError: string;
  };
  signup: {
    subtitle: string;
    hotelName: string;
    hotelNamePlaceholder: string;
    yourName: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    haveAccount: string;
    login: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  ro: {
    nav: {
      dashboard: "Dashboard",
      rooms: "Camere",
      bookings: "Rezervări",
      guests: "Clienți fideli",
      housekeeping: "Housekeeping",
      staff: "Personal",
      reports: "Rapoarte",
      parking: "Parcare",
      settings: "Setări",
      logout: "Deconectare",
    },
    dashboard: {
      welcome: "Bun venit",
      summary: "Sumar operațional",
      roomsHeading: "Camere",
      tasksHeading: "Task-uri active",
      paymentsHeading: "Plăți",
      dueLabel: "Rest de încasat",
      roomStatus: {
        clean: "Curate",
        dirty: "De curățat",
        inprogress: "În curs",
        blocked: "Blocate",
      },
      taskStatus: {
        todo: "De făcut",
        inprogress: "În curs",
      },
    },
    login: {
      title: "Hotel Ops",
      subtitle: "Autentifică-te în contul tău",
      email: "Email",
      password: "Parolă",
      submit: "Autentificare",
      submitting: "Se autentifică...",
      noAccount: "Nu ai cont?",
      createHotel: "Creează un hotel",
      noProfileError:
        "Contul a fost confirmat, dar înregistrarea hotelului nu s-a finalizat. Te rugăm să creezi hotelul din nou.",
    },
    signup: {
      subtitle: "Creează contul de administrator și hotelul tău",
      hotelName: "Numele hotelului",
      hotelNamePlaceholder: "Hotel Panorama",
      yourName: "Numele tău",
      email: "Email",
      password: "Parolă",
      submit: "Creează hotelul",
      submitting: "Se creează...",
      haveAccount: "Ai deja cont?",
      login: "Autentifică-te",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      rooms: "Rooms",
      bookings: "Bookings",
      guests: "Loyal guests",
      housekeeping: "Housekeeping",
      staff: "Staff",
      reports: "Reports",
      parking: "Parking",
      settings: "Settings",
      logout: "Sign out",
    },
    dashboard: {
      welcome: "Welcome",
      summary: "Operational summary",
      roomsHeading: "Rooms",
      tasksHeading: "Active tasks",
      paymentsHeading: "Payments",
      dueLabel: "Outstanding balance",
      roomStatus: {
        clean: "Clean",
        dirty: "Dirty",
        inprogress: "In progress",
        blocked: "Blocked",
      },
      taskStatus: {
        todo: "To do",
        inprogress: "In progress",
      },
    },
    login: {
      title: "Hotel Ops",
      subtitle: "Sign in to your account",
      email: "Email",
      password: "Password",
      submit: "Sign in",
      submitting: "Signing in...",
      noAccount: "No account yet?",
      createHotel: "Create a hotel",
      noProfileError:
        "Your account was confirmed, but the hotel setup wasn't completed. Please create the hotel again.",
    },
    signup: {
      subtitle: "Create your admin account and hotel",
      hotelName: "Hotel name",
      hotelNamePlaceholder: "Panorama Hotel",
      yourName: "Your name",
      email: "Email",
      password: "Password",
      submit: "Create hotel",
      submitting: "Creating...",
      haveAccount: "Already have an account?",
      login: "Sign in",
    },
  },
};

export const LOCALES: Locale[] = ["ro", "en"];
