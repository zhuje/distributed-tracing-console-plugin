import * as React from 'react';
import { cancellableFetch } from '../cancellable-fetch';

type TempoStackListResponse = {
  namespace: string;
  name: string;
}

export const useTempoStack2 = () => {
  const [tempoStackList2, setTempoStackList2] = React.useState<
  Array<TempoStackListResponse>
>([]);

  React.useEffect(() => {
    // declare the async data fetching function
    const fetchData = async () => {
      const { request } = cancellableFetch<TempoStackListResponse[]>(
        `/api/plugins/distributed-tracing-console-plugin/api/v1/list-tempostacks`,
      );

      let response: Array<TempoStackListResponse> = [];

      response = await request();
      console.log("JZ Response: ", response)
      
      setTempoStackList2(response)
      console.log("JZ TempoStackList2 : ", tempoStackList2)
    }

    // call the function
    fetchData()
      // make sure to catch any error
      .catch(console.error);
  }, [])


  return {
    tempoStackList2,
  };
};
