const isProdLikeEnv = (): boolean => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' || env === 'staging';
};

export default isProdLikeEnv;

