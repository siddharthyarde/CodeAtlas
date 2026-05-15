function App() {
  const [route, setRoute] = useState('landing');
  const [authed, setAuthed] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'success') => {
    const id = Math.random();
    setToasts(t => [...t, { id, msg, type }]);
  }, []);
  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // Reset scroll on route change
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  const navigate = (r) => {
    // Public routes
    if (r === 'landing' || r === 'login' || r === 'signup') {
      if (r !== 'landing') setAuthed(false);
      setRoute(r);
      return;
    }
    // Protected routes — auto-auth in prototype if visiting directly via sidebar
    if (!authed) setAuthed(true);
    setRoute(r);
  };

  const handleAuth = () => { setAuthed(true); setRoute('dashboard'); toast(`Welcome${MockData.user.name ? ', ' + MockData.user.name.split(' ')[0] : ''}!`); };
  const handleLogout = () => { setAuthed(false); setRoute('landing'); toast('Signed out'); };

  let content;
  if (route === 'landing') content = <Landing navigate={navigate} />;
  else if (route === 'login' || route === 'signup') content = <AuthPage mode={route} navigate={navigate} onAuth={handleAuth} />;
  else {
    const PageMap = {
      dashboard: Dashboard,
      repositories: RepositoriesPage,
      graph: GraphPage,
      files: FilesPage,
      complexity: ComplexityPage,
      docs: DocsPage,
      pr: PRPage,
      team: TeamPage,
      usage: UsagePage,
      settings: SettingsPage,
    };
    const Page = PageMap[route] || Dashboard;
    // Graph, Files, Docs are fixed-position full-canvas, render their own sidebar slot via PageWrapper
    const fullCanvas = route === 'graph' || route === 'files' || route === 'docs';
    if (fullCanvas) {
      content = (
        <>
          <Sidebar route={route} navigate={navigate} onLogout={handleLogout} />
          <Page navigate={navigate} toast={toast} />
        </>
      );
    } else {
      content = (
        <PageWrapper route={route} navigate={navigate} onLogout={handleLogout}>
          <Page navigate={navigate} toast={toast} />
        </PageWrapper>
      );
    }
  }

  return (
    <>
      {content}
      {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => removeToast(t.id)} />)}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
