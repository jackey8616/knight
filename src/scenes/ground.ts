import {
  ActionEvent,
  ActionManager,
  DynamicTexture,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Color4,
  PhysicsImpostor,
} from '@babylonjs/core';

export default class Ground {
  private isDebug: boolean;
  private cubeSize: number;
  private gridSize: number;
  private ground: Array<Mesh>;
  private clickedGrid: Mesh | null;

  constructor(cubeSize: number, gridSize: number, isDebug?: boolean) {
    this.isDebug = isDebug || false;
    this.cubeSize = cubeSize;
    this.gridSize = gridSize;
    this.ground = [];
    this.clickedGrid = null;
  }

  init(scene: Scene) {
    this.ground = this.createGround(scene);
    return scene;
  }

  public setDebug(value: boolean) {
    this.isDebug = value;
  }

  private createActionManager(scene: Scene) {
    const actionManager = new ActionManager(scene);
    
    actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnPointerOverTrigger,
      (event: ActionEvent) => event.meshUnderPointer!.enableEdgesRendering(),
    ));
    actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnPointerOutTrigger,
      (event: ActionEvent) => {
        const box = event.meshUnderPointer!;
        if (this.clickedGrid === null || box.name !== this.clickedGrid.name) {
          box.disableEdgesRendering();
        }
      },
    ));
    actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnPickTrigger,
      (event: ActionEvent) => {
        const box = event.meshUnderPointer!;
        if (this.clickedGrid) {
          this.clickedGrid.disableEdgesRendering();
        }
        if (this.clickedGrid == null || this.clickedGrid.name !== box.name) {
          this.clickedGrid = box as Mesh;
          this.clickedGrid.enableEdgesRendering();
        }
      },
    ));

    return actionManager;
  }

  private createGround(scene: Scene) {
    const grids = [];
    // Building Grids
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {

        const grid = MeshBuilder.CreateBox(
          `Grid-${grids.length}`,
          { size: this.cubeSize },
          scene,
        );

        // Material
        if (this.isDebug) {
          const texture = new DynamicTexture(`text-${grids.length}`, { width: 500, height: 500 }, scene);
          texture.drawText(`${grids.length}`, null, null, '120px solid Arial', 'blue', 'white');

          const material = new StandardMaterial(`material-${grids.length}`);
          material.diffuseTexture = texture;

          grid.material = material;
        }
        // Physic
        grid.physicsImpostor = new PhysicsImpostor(
          grid,
          PhysicsImpostor.BoxImpostor,
          { mass: 0, friction: 0, restitution: 0 },
          scene,
        );      
        // ActionManager
        grid.actionManager = this.createActionManager(scene);
        // Position
        grid.position.copyFromFloats(
          (x - this.gridSize / 2) * this.cubeSize,
          0,
          (y - this.gridSize / 2) * this.cubeSize,
        );
        // Coloring edge
        grid.edgesColor = new Color4(0, 0, 0, 1);
        grid.edgesWidth = 4;

        grids.push(grid);
      }
    }
    return grids;
  }
}