import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyc-Bf7N6AxAGdOzuP5x-Sag94NNilGHU",
  authDomain: "gestao-imoveis-ac9c2.firebaseapp.com",
  projectId: "gestao-imoveis-ac9c2",
  storageBucket: "gestao-imoveis-ac9c2.firebasestorage.app",
  messagingSenderId: "325598717619",
  appId: "1:325598717619:web:548388c4b2359b548032c6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);