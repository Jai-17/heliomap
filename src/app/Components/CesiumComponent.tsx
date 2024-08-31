'use client'

import React from 'react'
import type { CesiumType } from '../types/cesium'
import { Cesium3DTileset, type Entity, type Viewer, Cartesian3 } from 'cesium';
import type { Position } from '../types/position';
//NOTE: It is important to assign types using "import type", not "import"
import { dateToJulianDate } from '../example_utils/date';
//NOTE: This is required to get the stylings for default Cesium UI and controls
import 'cesium/Build/Cesium/Widgets/widgets.css';

export const CesiumComponent: React.FunctionComponent<{
    CesiumJs: CesiumType,
    positions: Position[]
}> = ({
    CesiumJs,
    positions
}) => {
    const cesiumViewer = React.useRef<Viewer | null>(null);
    const cesiumContainerRef = React.useRef<HTMLDivElement>(null);
    const addedScenePrimitives = React.useRef<Cesium3DTileset[]>([]);
    const [isLoaded, setIsLoaded] = React.useState(false);

    const resetCamera = React.useCallback(async () => {
        // Set the initial camera to look at Seattle
        // No need for dependancies since all data is static for this example.
        if (cesiumViewer.current !== null) {
            cesiumViewer.current.scene.camera.setView({
                destination: CesiumJs.Cartesian3.fromDegrees(76.36244, 30.35144, 370), // long, lat, altitude
                orientation: {
                  heading: CesiumJs.Math.toRadians(10), // direction the camera is facing horizontally 0-north, +ve-east, -ve-west
                  pitch: CesiumJs.Math.toRadians(-15), // the tilt of the camera, angle from horizon, 0-level with horizon, -ve-downward, +ve-upward(towards sky)
                },
              });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [CesiumJs]);

    const cleanUpPrimitives = React.useCallback(() => {
        //On NextJS 13.4+, React Strict Mode is on by default.
        //The block below will remove all added primitives from the scene.
        addedScenePrimitives.current.forEach(scenePrimitive => {
            if (cesiumViewer.current !== null) {
                cesiumViewer.current.scene.primitives.remove(scenePrimitive);
            }
        });
        addedScenePrimitives.current = [];
    }, []);

    
    const initializeCesiumJs = React.useCallback(async () => {
        if (cesiumViewer.current !== null) {
            //Using the Sandcastle example below
            //https://sandcastle.cesium.com/?src=3D%20Tiles%20Feature%20Styling.html
            const osmBuildingsTileset = await CesiumJs.createOsmBuildingsAsync();
            
            //Clean up potentially already-existing primitives.
            cleanUpPrimitives();

            //Adding tile and adding to addedScenePrimitives to keep track and delete in-case of a re-render.
            const osmBuildingsTilesetPrimitive = cesiumViewer.current.scene.primitives.add(osmBuildingsTileset);
            console.log(cesiumViewer.current.scene);
            addedScenePrimitives.current.push(osmBuildingsTilesetPrimitive);
            
            //Position camera per Sandcastle demo
            resetCamera();

            //We'll also add our own data here (In Philadelphia) passed down from props as an example
            positions.forEach(p => {
                cesiumViewer.current?.entities.add({
                    position: CesiumJs.Cartesian3.fromDegrees(p.lng, p.lat), // lat, long to cartesian coordinates
                    ellipse: {
                        semiMinorAxis: 50000.0,
                        semiMajorAxis: 50000.0,
                        height: 0,
                        material: CesiumJs.Color.RED.withAlpha(0.5),
                        outline: true,
                        outlineColor: CesiumJs.Color.BLACK,
                    }
                });
            });

            cesiumViewer.current.scene.globe.enableLighting = true;
            cesiumViewer.current.shadows = true;
            if(cesiumViewer.current.scene.shadowMap){
                cesiumViewer.current.scene.shadowMap.enabled = true;
                cesiumViewer.current.scene.shadowMap.size = 2048;
                cesiumViewer.current.scene.shadowMap.softShadows = true; 
            }

            // const sensor = new CesiumJs.CustomSensorVolume({
            //     modelMatrix: CesiumJs.Matrix4.fromTranslation(CesiumJs.Cartesian3.fromDegrees(-122.3472, 47.598, 100)),
            //     radius: 300.0,
            //     innerMaterial: CesiumJs.Color.RED.withAlpha(0.5),
            //     outerMaterial: CesiumJs.Color.YELLOW.withAlpha(0.2),
            //     show: true, // Ensure the sensor is visible
            // });
            // cesiumViewer.current.scene.primitives.add(sensor);

            //Set loaded flag
            setIsLoaded(true);

            // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }, [positions, CesiumJs, cleanUpPrimitives, resetCamera]);

    React.useEffect(() => {
        if (isLoaded) return;
        initializeCesiumJs();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [positions, isLoaded, initializeCesiumJs]);

    React.useEffect(() => {
        if (cesiumViewer.current === null && cesiumContainerRef.current) {
            //OPTIONAL: Assign access Token here
            //Guide: https://cesium.com/learn/ion/cesium-ion-access-tokens/
            CesiumJs.Ion.defaultAccessToken = `${process.env.NEXT_PUBLIC_CESIUM_TOKEN}`;

            //NOTE: Always utilize CesiumJs; do not import them from "cesium"
            cesiumViewer.current = new CesiumJs.Viewer(cesiumContainerRef.current, {
                //Using the Sandcastle example below
                //https://sandcastle.cesium.com/?src=3D%20Tiles%20Feature%20Styling.html
                terrain: CesiumJs.Terrain.fromWorldTerrain(),
                shadows: true
            });

            //NOTE: Example of configuring a Cesium viewer
            cesiumViewer.current.clock.clockStep = CesiumJs.ClockStep.SYSTEM_CLOCK_MULTIPLIER; // SYSTEM_CLOCK means time advances in realtime, multiplier can speed it up or slow down the simulation

            // const osmBuildingsTileset = cesiumViewer.current.scene.primitives.add(CesiumJs.createOsmBuildingsAsync());

            // Function to get Sun's position
            const getSunPosition = () => {
                const date = CesiumJs.JulianDate.fromDate(new Date());
                const sunPosition = CesiumJs.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(date);
                const transformMatrix = CesiumJs.Transforms.computeTemeToPseudoFixedMatrix(date);
                
                if(transformMatrix){
                    const sunPositionFixed = CesiumJs.Matrix3.multiplyByVector(
                        transformMatrix,
                        sunPosition,
                        new Cartesian3()
                    );

                    // Convert to Cartographic for azimuth and elevation calculations
                    const sunCartographic = CesiumJs.Cartographic.fromCartesian(sunPositionFixed);
                    const sunAzimuth = CesiumJs.Math.toDegrees(sunCartographic.longitude);
                    const sunElevation = CesiumJs.Math.toDegrees(sunCartographic.latitude);
                    console.log('Sun Position:', { sunAzimuth, sunElevation });
                }else{
                    console.error('Failed to compute the transformation matrix for the sun position.');
                }
            };

            // Function to extract building data
            const extractBuildingData = (tileset: Cesium3DTileset) => {
                tileset.tileVisible.addEventListener((tile) => {
                    const content = tile.content;
                    for (let i = 0; i < content.featuresLength; i++) {
                        const feature = content.getFeature(i);
                        // Access properties like height, longitude, latitude
                        const longitude = feature.getProperty('longitude') || feature.getProperty('lon');
                        const latitude = feature.getProperty('latitude') || feature.getProperty('lat');
                        const height = feature.getProperty('height');
                        console.log('Building Data:', { latitude, longitude, height });
                    }
                });
            };

            // Ensure osmBuildingsTileset is awaited correctly
            // CesiumJs.createOsmBuildingsAsync().then((osmBuildingsTileset) => {
            //     const osmBuildingsTilesetPrimitive = cesiumViewer.current?.scene.primitives.add(osmBuildingsTileset);
            //     console.log(cesiumViewer.current?.scene);
            //     if (osmBuildingsTilesetPrimitive instanceof Cesium3DTileset) {
            //         extractBuildingData(osmBuildingsTilesetPrimitive);
            //     }
            // }).catch((error) => {
            //     console.error('Error loading OSM buildings:', error);
            // });

            getSunPosition();

            // return() =>{
            //     cesiumViewer.current?.destroy();
            // }
        }
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [CesiumJs]);

    //NOTE: Examples of typing... See above on "import type"
    // const entities: Entity[] = [];
    //NOTE: Example of a function that utilizes CesiumJs features

    const julianDate = dateToJulianDate(CesiumJs, new Date());


    return (
        <div
            ref={cesiumContainerRef}
            id='cesium-container'
            style={{height: '100vh', width: '100vw'}}
        />
    )
}

export default CesiumComponent