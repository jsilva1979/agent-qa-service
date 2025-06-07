export const config = {
  kubernetes: {
    kubeConfig: process.env.KUBE_CONFIG,
    namespace: process.env.KUBE_NAMESPACE || 'default'
  },
  scaling: {
    limiteCpu: Number(process.env.SCALING_LIMITE_CPU) || 80,
    limiteMemoria: Number(process.env.SCALING_LIMITE_MEMORIA) || 80,
    limiteFila: Number(process.env.SCALING_LIMITE_FILA) || 1000,
    minPods: Number(process.env.SCALING_MIN_PODS) || 1,
    maxPods: Number(process.env.SCALING_MAX_PODS) || 10
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
}; 