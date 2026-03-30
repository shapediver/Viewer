#!/usr/bin/env node

/**
 * Auto-generate llms.txt for the ShapeDiver Viewer repository
 * This script is designed to run during the publishing process
 */

const fs = require("fs");
const path = require("path");
const {execSync} = require("child_process");

class LLMSGenerator {
	constructor() {
		this.rootPath = process.cwd();
		this.packageInfo = {};
		this.features = [];
		this.examples = [];
		this.currentVersion = "";
	}

	async generate() {
		console.log("🔄 Generating llms.txt...");

		try {
			// Gather information
			await this.gatherPackageInfo();
			await this.gatherFeatureInfo();
			await this.gatherExampleInfo();
			await this.getCurrentVersion();

			// Generate content
			const content = this.generateContent();

			// Write file
			fs.writeFileSync(path.join(this.rootPath, "llms.txt"), content);

			console.log("✅ llms.txt generated successfully!");
			return true;
		} catch (error) {
			console.error("❌ Error generating llms.txt:", error.message);
			return false;
		}
	}

	async gatherPackageInfo() {
		const packageJsonPaths = [
			"api/default/package.json",
			"api/session/package.json",
			"api/viewport/package.json",
			"features/drawing-tools/package.json",
			"features/interaction/package.json",
			"features/attribute-visualization/package.json",
			"features/gumballTransform/package.json",
		];

		for (const pkgPath of packageJsonPaths) {
			const fullPath = path.join(this.rootPath, pkgPath);
			if (fs.existsSync(fullPath)) {
				const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
				this.packageInfo[content.name] = {
					version: content.version,
					description: content.description,
					keywords: content.keywords || [],
					license: content.license,
				};
			}
		}
	}

	async gatherFeatureInfo() {
		const featuresDir = path.join(this.rootPath, "features");
		if (!fs.existsSync(featuresDir)) return;

		const features = fs
			.readdirSync(featuresDir, {withFileTypes: true})
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		for (const feature of features) {
			const readmePath = path.join(featuresDir, feature, "README.md");
			const packagePath = path.join(featuresDir, feature, "package.json");

			if (fs.existsSync(readmePath) && fs.existsSync(packagePath)) {
				const readme = fs.readFileSync(readmePath, "utf8");
				const packageJson = JSON.parse(
					fs.readFileSync(packagePath, "utf8"),
				);

				// Extract help desk link
				const helpLinkMatch = readme.match(
					/\[help desk section\]\((.*?)\)/,
				);
				const helpLink = helpLinkMatch ? helpLinkMatch[1] : null;

				// Extract description from README
				const descMatch = readme.match(
					/This is the npm package for the ShapeDiver Viewer ([^.]+)\./,
				);
				const description = descMatch
					? descMatch[1]
					: packageJson.description;

				this.features.push({
					name: feature,
					packageName: packageJson.name,
					description,
					helpLink,
					version: packageJson.version,
				});
			}
		}
	}

	async gatherExampleInfo() {
		const examplesDir = path.join(this.rootPath, "examples");
		if (!fs.existsSync(examplesDir)) return;

		const examples = fs
			.readdirSync(examplesDir, {withFileTypes: true})
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)
			.slice(0, 5); // Limit to first 5 examples

		for (const example of examples) {
			const indexPath = path.join(
				examplesDir,
				example,
				"src",
				"index.ts",
			);
			if (fs.existsSync(indexPath)) {
				const content = fs.readFileSync(indexPath, "utf8");

				// Extract imports to understand what features are used
				const imports =
					content.match(
						/import.*from\s+["']@shapediver\/viewer[^"']*["']/g,
					) || [];
				const usedFeatures = imports
					.map((imp) =>
						imp.match(/@shapediver\/viewer\.features\.([^"']+)/),
					)
					.filter(Boolean)
					.map((match) => match[1]);

				this.examples.push({
					name: example,
					usedFeatures,
					hasComplexSetup:
						content.includes("createViewport") &&
						content.includes("createSession"),
				});
			}
		}
	}

	async getCurrentVersion() {
		const mainPackagePath = path.join(
			this.rootPath,
			"api",
			"default",
			"package.json",
		);
		if (fs.existsSync(mainPackagePath)) {
			const content = JSON.parse(
				fs.readFileSync(mainPackagePath, "utf8"),
			);
			this.currentVersion = content.version;
		}
	}

	generateContent() {
		const timestamp = new Date().toISOString().split("T")[0];

		return `# ShapeDiver Viewer

The ShapeDiver Viewer is a comprehensive 3D visualization library built with TypeScript and WebGL. This is the main repository for the ShapeDiver Viewer, which produces the \`@shapediver/viewer\` npm package and its feature extensions.

**Current Version**: ${this.currentVersion}
**Generated**: ${timestamp}

## Project Overview

The ShapeDiver Viewer is a powerful 3D visualization library that integrates with the ShapeDiver platform for parametric 3D modeling and visualization.

- **Main Package**: \`@shapediver/viewer\` - Complete package combining both viewport and session APIs
- **Package Architecture**: The main package includes both IViewportApi and ISessionApi, while specialized packages allow using them separately
- **Technology Stack**: TypeScript, Three.js, WebGL with Grasshopper integration
- **Platform**: Integrates with ShapeDiver's parametric modeling platform
- **License**: ${this.packageInfo["@shapediver/viewer"]?.license || "polyform-noncommercial-1.0.0"}

## Published NPM Packages

### Core Package
- \`@shapediver/viewer\` (v${this.packageInfo["@shapediver/viewer"]?.version || this.currentVersion}) - Complete API combining both viewport and session functionality
  - **Combined Package** - Includes both IViewportApi and ISessionApi in one package
  - **Full Integration** - Use createViewport() and createSession() together
  - **Recommended** - Best choice for most applications requiring 3D visualization with ShapeDiver backend

### Specialized Core Packages
- \`@shapediver/viewer.session\` (v${this.packageInfo["@shapediver/viewer.session"]?.version || this.currentVersion}) - Session-only API for headless usage (server-side, Node.js applications)
  - **Server-Side Operations** - Run without browser/DOM dependencies
  - **Batch Processing** - Process multiple models programmatically
  - **API Integration** - Integrate ShapeDiver models into web services
  - **Export Automation** - Automated model generation and export workflows
- \`@shapediver/viewer.viewport\` (v${this.packageInfo["@shapediver/viewer.viewport"]?.version || this.currentVersion}) - Viewport-only API for hydra usage (rendering without ShapeDiver backend)
  - **External 3D Content** - Render GLTF and other formats
  - **Custom Rendering** - Use Three.js viewport without ShapeDiver backend
  - **Lightweight Integration** - Minimal dependencies for pure rendering
  - **Local Content** - Display locally stored or generated 3D models

### Feature Packages (Optional Add-ons)
${this.features
	.map(
		(feature) =>
			`- \`${feature.packageName}\` (v${feature.version}) - ${feature.description}${feature.helpLink ? `\n  - [Help Documentation](${feature.helpLink})` : ""}`,
	)
	.join("\n")}

## Documentation Links

- **Official Documentation**: [Viewer API Documentation](https://viewer.shapediver.com/v3/latest/api/index.html)
- **Help Desk**: [ShapeDiver Viewer Help](https://help.shapediver.com/doc/viewer) - introductions, descriptions and guides  
- **Examples**: [Interactive Examples](https://viewer.shapediver.com/v3/examples/index.html) - with GitHub links and CodeSandboxes
- **Forum**: [ShapeDiver Forum](https://forum.shapediver.com/) - community support
- **Homepage**: [ShapeDiver.com](https://shapediver.com/)

## Key Concepts

### Core APIs (from @shapediver/viewer)

#### IViewportApi - 3D Rendering and Visualization
- **createViewport()** - Creates 3D rendering viewports with WebGL/Three.js
- **Scene Management** - Load, display, and manipulate 3D content and GLTF models
- **Camera Controls** - Perspective/orthographic cameras with zoom, pan, rotate
- **Lighting Systems** - Ambient, directional, point, spot, and hemisphere lights
- **Material & Texture Management** - PBR materials, textures, and visual properties
- **Animation Support** - Timeline-based animations and morphing
- **Rendering Pipeline** - Post-processing effects, shadows, and visual enhancements
- **Canvas Integration** - Direct HTML5 Canvas rendering with responsive design

#### ISessionApi - ShapeDiver Backend Integration
- **createSession()** - Manages viewer sessions connected to ShapeDiver backend
- **Parameter Management** - Update and control Grasshopper definition parameters
- **Export Functionality** - Generate and download 3D models in various formats
- **Output Management** - Access and control model outputs and geometry data
- **Computation Status** - Track backend processing and model updates
- **Ticket Authentication** - Secure access to ShapeDiver models via ticket system
- **Real-time Updates** - Automatic model updates when parameters change

#### Specialized Parameter APIs
- **IParameterApi** - Base interface for all parameter types with validation and change tracking
- **IFileParameterApi** - Handle file uploads and file-based parameters
- **ISelectionParameterApi** - Manage selection-based parameters with multiple choice options
- **IDraggingParameterApi** - Support drag-and-drop interactions for 3D parameter control
- **IDrawingParameterApi** - Enable drawing-based parameter input (lines, shapes, annotations)
- **IGumballTransformParameterApi** - 3D transformation gizmo for object manipulation
- **IInteractionParameterApi** - General interaction-based parameter handling

#### Sub-APIs for Advanced Control
- **ICameraApi** - Camera positioning, movement, and projection settings
- **ILightApi** - Individual light control (ambient, directional, point, spot, hemisphere)
- **ILightSceneApi** - Manage entire lighting setup and environment
- **IPostProcessingApi** - Visual effects pipeline (bloom, depth of field, anti-aliasing, etc.)
- **IOutputApi** - Access to model output data and 3D content from sessions
- **IExportApi** - Request and download exports in various formats

#### Common Usage Patterns
- **Parameter Updates** - Adjust parameters by setting \`parameter.value\` and calling \`session.customize()\` (default customization method)
- **Export Requests** - Request exports by calling \`export.request()\` method on individual export objects

#### Event System & Error Handling
- **EVENTTYPE Constants** - Comprehensive event handling for user interactions
- **Custom Events** - Scene updates, parameter changes, export completion
- **Structured Errors** - Type-safe error handling with specific error types
- **Type Guards** - Runtime type checking (isViewerError, isViewerSessionError, isViewerViewportError)

### Import Patterns
\`\`\`typescript
// Core viewer - combines both viewport and session APIs (recommended for most use cases)
import { createViewport, createSession, VISIBILITY_MODE, SESSION_SETTINGS_MODE, EVENTTYPE } from "@shapediver/viewer";

// Specialized core packages - use when you need only one API
import { createSession } from "@shapediver/viewer.session"; // Session-only (headless usage)
import { createViewport } from "@shapediver/viewer.viewport"; // Viewport-only (hydra usage)

// Error handling imports (available in all packages)
import { isViewerError, isViewerSessionError, isViewerViewportError } from "@shapediver/viewer";

// Feature packages - separate installs
import { createDrawingTools } from "@shapediver/viewer.features.drawing-tools";
import { InteractionEngine, SelectManager, DragManager } from "@shapediver/viewer.features.interaction";
import { AttributeVisualizationEngine } from "@shapediver/viewer.features.attribute-visualization";
import { GumballTransform } from "@shapediver/viewer.features.gumballTransform";
\`\`\`

### 3D Rendering
- Built on Three.js for WebGL rendering
- Camera management (perspective/orthographic)
- Lighting systems (ambient, directional, point, spot, hemisphere)
- Material and texture management
- Animation support

### Data Processing
- GLTF model loading and conversion
- Geometry processing and optimization
- SDTF (ShapeDiver Transfer Format) support
- Attribute visualization and analysis

### Session Management
- Parameter-driven model updates through ShapeDiver backend connection
- Export functionality for various 3D formats
- Computation status tracking and model updates
- Backend API integration with ShapeDiver servers
- Ticket-based authentication system

## Common Usage Patterns

### Basic Setup (Core Package Only)
\`\`\`typescript
// @shapediver/viewer includes both viewport and session APIs
import { createViewport, createSession } from "@shapediver/viewer";

// Create a viewport (from included viewport API)
const viewport = await createViewport({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    id: "myViewport"
});

// Create a session (from included session API)
const session = await createSession({
    id: "mySession",
    ticket: "YOUR_TICKET_HERE",
    modelViewUrl: "YOUR_MODEL_VIEW_URL_HERE"
});

// Access model data through properties (not methods)
const parameters = session.parameters; // {[key: string]: IParameterApi}
const outputs = session.outputs; // {[key: string]: IOutputApi}  
const exports = session.exports; // {[key: string]: IExportApi}

// Get a specific parameter by name
const lengthParameter = session.getParameterByName("length")[0];

// set the value
lengthParameter.value = 200;

// Get a specific parameter by id
const widthParameter = session.getParameterById("width");
widthParameter.value = 100;

// Customize model with the parameters that are currently set
await session.customize();


// Alternative: Set the parameters directly
await session.customize({
	length: 200,
	width: 100
});


// Access current parameter values
const currentValues = session.parameterValues;
const defaultValues = session.parameterDefaultValues;
\`\`\`

### Parameter Updates and Export Requests
\`\`\`typescript
import { createSession } from "@shapediver/viewer.session";

const session = await createSession({
    id: "mySession",
    ticket: "YOUR_TICKET_HERE",
    modelViewUrl: "YOUR_MODEL_VIEW_URL_HERE"
});

// Method 1: Adjust parameters by setting parameter.value and calling session.customize()
// This is the default way of doing customizations
const parameter = session.parameters["length"];
parameter.value = 150; // Set the parameter value

await session.customize(); // Apply the changes to the model

// Method 2: Request an export by calling export.request()
const exportObj = session.exports["my_export_id"];
const exportResult = await exportObj.request(); // Request the specific export

// You can also pass custom parameters to the export request
const customExportResult = await exportObj.request({
    "width": 200,
    "material": "aluminum"
});
\`\`\`

### Batch Processing Example
\`\`\`typescript
// Export requests (use requestExports, not requestExport)
const exportRequest = await session.requestExports({
    exports: ["export_id"], 
    parameters: { paramName: "value" }
});
\`\`\`

## Package Installation Guide

### Core Package (Recommended for Most Applications)
\`\`\`bash
# Complete package with both viewport and session APIs
npm install @shapediver/viewer
\`\`\`

### Specialized Core Packages (When You Need Only One API)
\`\`\`bash
# For headless usage (server-side, Node.js applications) - session API only
npm install @shapediver/viewer.session

# For hydra usage (rendering without ShapeDiver backend) - viewport API only
npm install @shapediver/viewer.viewport
\`\`\`
\`\`\`

### Feature Packages (Optional)
\`\`\`bash
# Install only the features you need
${this.features.map((f) => `npm install ${f.packageName}`).join("\n")}
\`\`\`

### Complete Installation
\`\`\`bash
# All packages
npm install @shapediver/viewer \\
${this.features.map((f) => `            ${f.packageName}`).join(" \\\n")}
\`\`\`

## Example Integrations

Based on the current examples in the repository:

${this.examples
	.map((example) => {
		const featuresUsed =
			example.usedFeatures.length > 0
				? `\n- **Features Used**: ${example.usedFeatures.join(", ")}`
				: "";
		const complexity = example.hasComplexSetup
			? "\n- **Setup**: Complete viewport and session setup"
			: "\n- **Setup**: Basic example";

		return `### ${example.name}${complexity}${featuresUsed}`;
	})
	.join("\n\n")}

## Error Handling Patterns

### Type Guards for Errors
\`\`\`typescript
import { 
    isViewerError, 
    isViewerSessionError,
    isViewerViewportError 
} from "@shapediver/viewer";

try {
    await createSession(config);
} catch (error) {
    if (isViewerSessionError(error)) {
        console.log("Session error:", error.message);
    } else if (isViewerError(error)) {
        console.log("Viewer error:", error.message);
    }
}
\`\`\`

## ShapeDiver Platform Integration

The viewer integrates seamlessly with the ShapeDiver platform:

- **Ticket System**: Uses tickets for secure model access
- **Model View URLs**: Points to ShapeDiver backend servers (e.g., \`https://sdr8euc1.eu-central-1.shapediver.com\`)
- **Grasshopper Integration**: Direct connection to Grasshopper definitions
- **App Builder**: Some features like GumballTransform are integrated with ShapeDiver App Builder
- **Platform Features**: Attribute visualization is already implemented on [shapediver.com/app](https://shapediver.com/app)

## Getting Started

For complete API documentation and interactive examples, visit:
- **API Documentation**: [https://viewer.shapediver.com/v3/latest/api/index.html](https://viewer.shapediver.com/v3/latest/api/index.html)
- **Interactive Examples**: [https://viewer.shapediver.com/v3/examples/index.html](https://viewer.shapediver.com/v3/examples/index.html)
- **ShapeDiver Help Center**: [https://help.shapediver.com/doc/viewer](https://help.shapediver.com/doc/viewer)

---

*This file was auto-generated on ${timestamp} from repository analysis.*
`;
	}
}

// CLI execution
if (require.main === module) {
	const generator = new LLMSGenerator();
	generator.generate().then((success) => {
		process.exit(success ? 0 : 1);
	});
}

module.exports = LLMSGenerator;
