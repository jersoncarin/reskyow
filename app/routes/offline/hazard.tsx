import HazardMap from '~/assets/hazard-map-min.jpg'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

const Hazard = () => {
  return (
    <div className="h-full bg-background text-foreground">
      <header className="fixed top-0 w-full insets-top z-10 bg-background flex items-center justify-center px-3 pb-3">
        <h1 className="text-lg font-semibold mt-1">Hazard Map</h1>
      </header>
      <main className="flex-1 p-4 mt-12 max-w-lg mx-auto">
        <TransformWrapper>
          <TransformComponent>
            <div className="w-full h-full">
              <img
                className="w-full h-full object-cover"
                src={HazardMap}
                alt="Hazard Map"
              />
            </div>
          </TransformComponent>
        </TransformWrapper>
      </main>
    </div>
  )
}

export default Hazard
