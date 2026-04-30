import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import Script from "next/script";

export default function App({ Component, pageProps }) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <AuthProvider>
      {clarityId && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${clarityId}");`}
        </Script>
      )}
      <Component {...pageProps} />
    </AuthProvider>
  );
}
