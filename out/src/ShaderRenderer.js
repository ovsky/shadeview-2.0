const vscode = require('vscode');
let panel = null;

let baseUniformsShaderTHREE = ``;

let baseVertexShaderTHREE = `
    varying vec3 vPosition;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;



let baseFragmentShaderTHREE = `
    varying vec3 vPosition;
    varying vec2 vUv;
    void main() {
        vec3 color = vec3(vUv, abs(sin(vPosition.y)));
        gl_FragColor = vec4(color, 1.0);
    }
`;

function getEditorText() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active shader file to render.');
        return;
    }
    return editor.document.getText();
}


function tryTranslateShaders() {
    let unityTranslated = false;

    try {
        const shaderCode = getEditorText();
        const translatedUnityCode = translateUnityToThree(shaderCode);

        const uniforms = translatedUnityCode.uniforms;
        const translatedUnityVertexShader = translatedUnityCode.vertexShader;
        const translatedUnityFragmentShader = translatedUnityCode.fragmentShader;

        uniformsShaderCode = Object.keys(uniforms).map((name) => {
            const uniform = uniforms[name];
            return `uniform ${uniform.type} ${name};`;
        }).join('\n') || uniformsShaderCode;

        baseVertexShaderTHREE = translatedUnityVertexShader || baseVertexShaderTHREE;
        baseFragmentShaderTHREE = translatedUnityFragmentShader || baseFragmentShaderTHREE;
        baseUniformsShaderTHREE = baseUniformsShaderTHREE || uniformsShaderCode;

    } catch (error) {
        unityTranslated = false;
        vscode.window.showInformationMessage('Failed to translate the Unity Shader code. Trying to translate the HLSL code...');
    }
    if (!unityTranslated) {
        vscode.window.showInformationMessage('Failed to translate the HLSL Shader code. Using the original code...');
        vscode.window.showErrorMessage('Due to intranslatable shader code, the shader preview may not work as expected.');
    }

    // if (!unityTranslated) {
    //     try {
    //         const translatedHlslCode = hlslToGLSLTHREE(shaderCode);
    //         const translatedHlslVertexShader = extractShaderPart(translatedHlslCode, 'vertex');
    //         const translatedHlslFragmentShader = extractShaderPart(translatedHlslCode, 'fragment');

    //         vertexShaderCode = translatedHlslVertexShader || vertexShaderCode;
    //         fragmentShaderCode = translatedHlslFragmentShader || fragmentShaderCode;
    //     } catch (error) {
    //         vscode.window.showInformationMessage('Failed to translate the HLSL Shader code. Using the original code...');
    //         vscode.window.showErrorMessage('Due to intranslatable shader code, the shader preview may not work as expected.');
    //     }
    // }
}


function renderShader() {

    tryTranslateShaders();
    const editor = vscode.window.activeTextEditor;


    if (!editor) {
        vscode.window.showErrorMessage('No active shader file to render.');
        return;
    }

    if (panel) {
        panel.dispose();
        panel = null;
        return;
    }

    const document = editor.document;
    const shaderCode = document.getText();

    // Create a WebView panel
    panel = vscode.window.createWebviewPanel(
        'shaderPreview',
        'Shader Preview',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
        }
    );

    if (panel) {
        panel.onDidDispose(() => {
            panel = null;
        });
    }

    panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Shader Preview</title>
            <style>
                body { margin: 0; overflow: hidden; display: flex; flex-direction: column; }
                canvas { display: block; width: 100vw; height: calc(100vh - 40px); }
                #controls { height: 40px; background: #222; color: white; display: flex; align-items: center; padding: 0 10px; }
                select { margin-left: 10px; }
            </style>
        </head>
        <body>
            <div id="controls">
                <label for="geometrySelect">Choose Geometry:</label>
                <select id="geometrySelect">
                    <option value="sphere">Sphere</option>
                    <option value="cube">Cube</option>
                    <option value="cylinder">Cylinder</option>
                    <option value="cone">Cone</option>
                    <option value="torus">Torus</option>
                </select>
            </div>
            <canvas id="shaderCanvas"></canvas>
            <script src="https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js"></script>
            <script>
                // Set up WebGL rendering with Three.js
                const canvas = document.getElementById('shaderCanvas');
                const renderer = new THREE.WebGLRenderer({ canvas });
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                camera.position.z = 3;

                // Light for better material shading
                const light = new THREE.PointLight(0xffffff, 1);
                light.position.set(5, 5, 5);
                scene.add(light);

                // Shader Material
                const customShaderMaterial = new THREE.ShaderMaterial({
                    vertexShader: \`${baseVertexShaderTHREE}\`,
                    fragmentShader: \`${baseFragmentShaderTHREE}\`,
                    uniforms: {  },
                });

                // Current mesh and geometry management
                let currentMesh;

                // Function to create a geometry
                function createGeometry(type) {
                    if (currentMesh) {
                        scene.remove(currentMesh);
                        currentMesh.geometry.dispose();
                    }

                    let geometry;
                    switch (type) {
                        case 'sphere':
                            geometry = new THREE.SphereGeometry(1, 32, 32);
                            break;
                        case 'cube':
                            geometry = new THREE.BoxGeometry(1, 1, 1);
                            break;
                        case 'cylinder':
                            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                            break;
                        case 'cone':
                            geometry = new THREE.ConeGeometry(0.5, 1, 32);
                            break;
                        case 'torus':
                            geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
                            break;
                        default:
                            geometry = new THREE.SphereGeometry(1, 32, 32);
                    }

                    currentMesh = new THREE.Mesh(geometry, customShaderMaterial);
                    scene.add(currentMesh);
                }

                // Initial geometry setup
                createGeometry('sphere');

                // Event listener for geometry selection
                document.getElementById('geometrySelect').addEventListener('change', (event) => {
                    createGeometry(event.target.value);
                });

                // Mouse controls for rotation
                let isDragging = false;
                let previousMousePosition = { x: 0, y: 0 };

                canvas.addEventListener('mousedown', (event) => {
                    isDragging = true;
                });

                canvas.addEventListener('mouseup', () => {
                    isDragging = false;
                });

                canvas.addEventListener('mousemove', (event) => {
                    if (isDragging && currentMesh) {
                        const deltaMove = {
                            x: event.offsetX - previousMousePosition.x,
                            y: event.offsetY - previousMousePosition.y,
                        };

                        currentMesh.rotation.y += deltaMove.x * 0.01;
                        currentMesh.rotation.x += deltaMove.y * 0.01;
                    }

                    previousMousePosition = {
                        x: event.offsetX,
                        y: event.offsetY,
                    };
                });

                // Zoom controls
                canvas.addEventListener('wheel', (event) => {
                    camera.position.z += event.deltaY * 0.01;
                    camera.position.z = Math.max(1, Math.min(10, camera.position.z)); // Clamp zoom range
                });

                // Resize handler
                window.addEventListener('resize', () => {
                    const width = window.innerWidth;
                    const height = window.innerHeight - 40; // Account for controls height
                    renderer.setSize(width, height);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                });

                // Initial resize setup
                window.dispatchEvent(new Event('resize'));

                // Render loop
                function animate() {
                    requestAnimationFrame(animate);
                    renderer.render(scene, camera);
                }
                animate();
            </script>
        </body>
        </html>
    `;



}

function translateUnityToThree(shaderCode, sourceLang = "HLSL", targetLang = "GLSLTHREE") {
    // Define translation rules for syntax conversion
    const rules = [
        // Replace Unity/HLSL-specific matrix declarations
        { pattern: /\bUNITY_MATRIX_MVP\b/g, replacement: "projectionMatrix * modelViewMatrix" },
        { pattern: /\bUNITY_MATRIX_MODEL\b/g, replacement: "modelMatrix" },
        { pattern: /\bUNITY_MATRIX_VIEW\b/g, replacement: "viewMatrix" },
        { pattern: /\bUNITY_MATRIX_PROJECTION\b/g, replacement: "projectionMatrix" },

        // Replace data types
        { pattern: /\bfloat4\b/g, replacement: "vec4" },
        { pattern: /\bfloat3\b/g, replacement: "vec3" },
        { pattern: /\bfloat2\b/g, replacement: "vec2" },
        { pattern: /\bfloat\b/g, replacement: "float" },
        { pattern: /\bhalf4\b/g, replacement: "vec4" },
        { pattern: /\bhalf3\b/g, replacement: "vec3" },
        { pattern: /\bhalf2\b/g, replacement: "vec2" },
        { pattern: /\bhalf\b/g, replacement: "float" },

        // Replace functions
        { pattern: /\bsaturate\b/g, replacement: "clamp" },
        { pattern: /\btex2D\(([^,]+), ([^)]+)\)/g, replacement: "texture($1, $2)" },
        { pattern: /\btexCUBE\(([^,]+), ([^)]+)\)/g, replacement: "textureCube($1, $2)" },
        { pattern: /\blerp\(/g, replacement: "mix(" },

        // Handle semantics and built-in uniforms
        { pattern: /\b_MainTex\b/g, replacement: "diffuseMap" },
        { pattern: /\b_Time\b/g, replacement: "time" },
        { pattern: /\b_SinTime\b/g, replacement: "sin(time)" },
        { pattern: /\b_CosTime\b/g, replacement: "cos(time)" },

        // Handle input/output
        { pattern: /\bstruct\s+v2f\b/g, replacement: "varying struct" },
        { pattern: /\bPOSITION\b/g, replacement: "position" },
        { pattern: /\bTEXCOORD\d*\b/g, replacement: "uv" },
        { pattern: /\bNORMAL\b/g, replacement: "normal" },

        // Entry points
        { pattern: /\bvoid\s+frag\s*\([^)]*\)\s*:\s*SV_Target\b/g, replacement: "void main()" },
        { pattern: /\bfragOutput\b/g, replacement: "gl_FragColor" }
    ];

    // Apply rules sequentially
    let translatedShader = shaderCode;
    rules.forEach(({ pattern, replacement }) => {
        translatedShader = translatedShader.replace(pattern, replacement);
    });

    // Extract uniforms, varyings, and properties into a single variable
    const uniforms = [];
    const vertexShaderLines = [];
    const fragmentShaderLines = [];

    const lines = translatedShader.split("\n");
    for (const line of lines) {
        if (/^uniform\s+/.test(line) || /^varying\s+/.test(line)) {
            uniforms.push(line.trim());
        } else if (/void\s+main\s*\(/.test(line)) {
            if (line.includes("frag") || line.includes("gl_FragColor")) {
                fragmentShaderLines.push(line);
            } else {
                vertexShaderLines.push(line);
            }
        } else {
            // Add general shader code to vertex/fragment shaders based on context
            if (line.includes("gl_Position")) {
                vertexShaderLines.push(line.trim());
            } else if (line.includes("gl_FragColor")) {
                fragmentShaderLines.push(line.trim());
            }
        }
    }

    // Combine vertex and fragment shaders with uniforms
    const vertexShader = `
        ${uniforms.join("\n")}

        void main() {
        ${vertexShaderLines.join("\n")}
        }
            `;

    const fragmentShader = `
        ${uniforms.join("\n")}

        void main() {
        ${fragmentShaderLines.join("\n")}
        }
            `;

    return {
        uniforms,
        vertexShader,
        fragmentShader
    };
}

module.exports = { renderShader };
