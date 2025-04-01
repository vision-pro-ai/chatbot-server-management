import { ChakraProvider, extendTheme } from "@chakra-ui/react";

// Extend the theme if needed
const theme = extendTheme({
  // Add your custom theme configuration here
});

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
