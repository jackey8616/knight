import {
  AbstractMesh,
  ActionManager,
  AnimationGroup,
  InterpolateValueAction,
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
  private rotateAction?: InterpolateValueAction;

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

    const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync('', import.meta.env.BASE_URL, 'character.glb', this.scene);
    const character = meshes[0] as Mesh;
    character.setParent(hitBox);
    character.position = new Vector3(0, -2, 0);
    
    this.createAnimation(animationGroups);

    this.createActionManager();

    return this;
  }

  walkUp() { this.teleport(new Vector3(0, 0, 1)); }

  walkDown() { this.teleport(new Vector3(0, 0, -1)); }

  walkRight() { this.teleport(new Vector3(1, 0, 0)); }

  walkLeft() { this.teleport(new Vector3(-1, 0, 0)); }

  jump() { this.teleport(new Vector3(0, 1, 0)); }

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

  private createActionManager() {
    if (!this.mesh) return;

    this.mesh.actionManager = new ActionManager(this.scene);

    this.rotateAction = new InterpolateValueAction(
      ActionManager.NothingTrigger,
      this.mesh,
      'rotation',
      new Vector3(0, 3, 0),
      300
    );
    this.mesh.actionManager.registerAction(this.rotateAction);
  }

  private teleport(vector: Vector3) {
    if (!this.mesh) {
      return;
    }

    this.mesh.position.addInPlace(vector.multiply(new Vector3(3, 3, 3)));

    // 轉向
    const current = this.mesh.rotation.y;
    const targetAngle = this.getForceAngle(vector);
    if (current !== targetAngle) {
      this.mesh.rotation.y = targetAngle;
      this.mesh.addRotation(0, targetAngle - current, 0);
    }
  }

  private getForceAngle(force: Vector3) {
    if (!this.mesh) {
      throw new Error('未建立 Mesh');
    }

    const forceVector = force.normalize();
    /** 企鵝面相正 Z 軸方向 */
    const characterVector = new Vector3(0, 0, 1);
    const deltaAngle = Math.acos(Vector3.Dot(forceVector, characterVector));

    /** 反餘弦求得角度範圍為 0~180 度，需要自行判斷負角度部分。
     *  力向量 X 軸分量為負時，表示夾角為負。
     */
    if (forceVector.x < 0) {
      return deltaAngle * -1;
    }

    return deltaAngle;
  }
}
