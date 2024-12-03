export function error_logger(function_name: string, err: any) {
  const time = new Date(Date.now()).getUTCDate();
  console.error(`${time}: Error in ${function_name}`, err);
}