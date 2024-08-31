import { Sun } from "resium";
import CesiumWrapper from "../Components/CesiumWrapper"

async function getPosition() {
  //Mimic server-side stuff...
  return {
    position: {
      lat: 39.953436, // coordinates of Philadelphia
      lng: -75.164356
    }
  }
}

export default async function MainPage() {
  const fetchedPosition = await getPosition();
  return (
    <CesiumWrapper positions={[fetchedPosition.position]} />
  )
}