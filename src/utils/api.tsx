type Callback<T = any> = (data: T) => void;

interface FileData {
  uri: string;
  name: string;
  type: string;
}

let base_url = 'https://zkbsgdbbhc.execute-api.us-east-1.amazonaws.com/Dev/';

export const postApi = async (
  url: string = '',
  header: Record<string, string> = {},
  body: Record<string, any> = {},
  onResponse: Callback | null = null,
  onCatch: Callback | null = null,
): Promise<any> => {
  const headers = {
    'Content-Type': 'application/json',
    ...header,
  };
  console.log(body);

  fetch(base_url + url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });
  fetch(base_url + url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  })
    .then(async response => {
      const text = await response.text();
      console.log('Raw Response:', text);

      try {
        const fixedText = text.replace(
          /"token":\s*([^"{\[][^,}\]]*)/g,
          '"token": "$1"',
        );

        return JSON.parse(fixedText);
      } catch (error) {
        console.error('JSON Parse Error:', error);
        throw new Error(`Invalid JSON response: ${text}`);
      }
    })
    .then(responseJson => {
      console.log('Parsed JSON:', responseJson);
      onResponse && onResponse(responseJson);
    })
    .catch(e => {
      console.error('Fetch Error:', e);
      onCatch && onCatch(e);
    });
};

export const getapi = async (
  url: string = '',
  header: Record<string, string> = {},
  onResponse: Callback | null = null,
  onCatch: Callback | null = null,
  file: FileData | null = null,
): Promise<any> => {
  const headers = {
    'Content-Type': 'application/json',
    ...header,
  };
  console.log('headerr');
  console.log(headers);
  fetch(base_url + url, {
    method: 'GET',
    headers: headers,
  })
    .then(response => response.json())
    .then(responseJson => {
      console.log('response: ' + JSON.stringify(responseJson));
      if (responseJson) {
        console.log('if entered');
      } else {
        console.log('else entered');
      }

      onResponse && onResponse(responseJson);
    })
    .catch(e => {
      console.log('error bellow');
      console.log(e);
      console.log('error Json ' + JSON.stringify(e));
      console.log('error toString ' + e.toString());

      onCatch && onCatch(e);
    });
};

export const student_details = id => {
  let responsee: any[] = [];
  const url = `/students/${id}`;
  const mheaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  fetch(base_url + url, {
    method: 'GET',
    headers: mheaders,
  })
    .then(response => response.json())
    .then(responseJson => {
      if (responseJson) {
        console.log('if entered');
        responsee.push(responseJson);
      } else {
        console.log('else entered');
      }
    })
    .catch(e => {
      console.log('error bellow');
      console.log(e);
      console.log('error Json ' + JSON.stringify(e));
      console.log('error toString ' + e.toString());
    });

  return responsee;
};
