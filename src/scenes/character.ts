import {
  AbstractMesh,
  AnimationGroup,
  Color4,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  SceneLoader,
  Vector3,
} from '@babylonjs/core';

interface AnimationMap {
  idle?: AnimationGroup,
  walk?: AnimationGroup,
  attack?: AnimationGroup,
}

export default class Character {
  private mesh: AbstractMesh | null;
  private name: string;
  private scene: Scene;
  private spawnPosition: Vector3;

  private animation: AnimationMap = {
    idle: undefined,
    walk: undefined,
    attack: undefined,
  };

  constructor(name: string, scene: Scene, spawnPosition: Vector3) {
    this.mesh = null;
    this.name = name;
    this.scene = scene;
    this.spawnPosition = spawnPosition;
  }

  async init() {
    const hitBox = this.createHitBox();
    this.mesh = hitBox;

    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync('', '/', 'character.glb', this.scene);
    const character = meshes[0] as Mesh;
    character.setParent(hitBox);
    character.position = new Vector3(0, -2, 0);
    
    this.createAnimation(animationGroups);

    return this;
  }

  private createHitBox() {
    const hitBox = MeshBuilder.CreateBox(`hitbox-${this.name}`, {
      width: 2, depth: 2, height: 4,
    });
    hitBox.position = this.spawnPosition;
    hitBox.visibility = 0;

    const hitBoxImposter = new PhysicsImpostor(
      hitBox,
      PhysicsImpostor.BoxImpostor,
      { mass: 1, friction: 0.7, restitution: 0.7 },
      this.scene,
    );

    hitBox.physicsImpostor = hitBoxImposter;
    return hitBox;
  }

  private createAnimation(animationGroups: Array<AnimationGroup>) {
    animationGroups.forEach((each) => each.stop());

    const attackAni = animationGroups.find(({ name }) => name === 'attack');
    const walkAni = animationGroups.find(({ name }) => name === 'walk');
    const idleAni = animationGroups.find(({ name }) => name === 'idle');

    this.animation.attack = attackAni;
    this.animation.walk = walkAni;
    this.animation.idle = idleAni;
  }

}
