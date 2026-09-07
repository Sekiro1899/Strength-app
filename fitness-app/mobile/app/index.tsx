import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function IndexScreen() {
  // Le routing est géré par _layout.tsx selon l'état d'auth.
  // Cet écran sert de splash/loading pendant la vérification.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1565C0" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
