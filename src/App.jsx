import { useState, useEffect, useCallback } from 'react';
import './App.css';
import JSZip from 'jszip';
import {bookListDB} from './localdb';
import styled,{keyframes,css} from "styled-components";
import { Input, Button, Icon } from 'semantic-ui-react'



const AppWrapper = styled.div`
  position: relative;
  margin: auto;
  display: flex;
  flex-flow: column nowrap;

  transition: all 1s;
`;


const InputBox = styled.div`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  gap: 4px;

  >div.input{
    flex: 1;
  }
`;


const animation = keyframes`
  from{
    opacity: 0;
  }
  to{
    opacity: 1;
  }
`;

const BookList = styled.div`
  position: relative;
  display: flex;
  flex-flow: column nowrap;

  border-radius: 4px;
  gap: 20px;

  &.hasMarginTop{
    margin-top: 20px;
  }



  >div.item{
    position: relative;

    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    border-radius: 5px;
    padding: 12px 14px;


    word-break: break-word;
    background-color: rgba(0,0,0,0.068);

    gap: 10px;

    >span{
      text-align: left;
    }

    &:hover{
      background-color: rgba(255,255,0,0.08);
      box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.25);
    }

    >button{
      background-color: transparent;
      border: none;
      outline: none;
      cursor: pointer;
    }


    animation: ${animation} var(--duration-ms);
  }
`;



function App() {
  const [count, setCount] = useState(0);
  const [isReady, setReady] = useState(false);
  const [booklist, setBooklist] = useState([]);
  const [value, setValue] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const zip = new JSZip();
    fetch('/ebook-list.json.zip').then((res) => res.arrayBuffer()).then((abb) => {
        const oldSize = +localStorage.getItem('size');
        return bookListDB.count().then((count)=>{
            if(oldSize !== +abb.byteLength || count === 0) {
                localStorage.setItem('size', abb.byteLength);
                return zip.loadAsync(abb).then((z)=>{
                    return z.file('ebook-list.json').async('string').then((data)=>{
                        const jsonData = JSON.parse(data);
                        return bookListDB.putAll(jsonData).then((res)=>true);
                    });
                });
            }
            return true;
        });
    }).then(setReady).catch((err)=>{
        console.error('Error:', err);
    });
  }, []);


  const search = useCallback((v)=>{
    setLoading(true);
    bookListDB.search(v)
      .then(setBooklist)
      .catch(console.error).finally(()=>{
        setLoading(false);
      });
  }, []);


  const downloadFile = useCallback((url)=>{
      fetch(url,{
          mode: 'no-cors',
          redirect: 'follow',
          cache: 'force-cache'
      })
      .then((res)=>res.blob())
      .then((blob)=>{
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = "file.pdf";
          a.click();
      });
  }, []);

  return <AppWrapper>
      <InputBox>
        <Input fluid placeholder='Search...' 
            size='large'
            value={value} 
            onChange={(e)=>setValue(e.target.value)} 
            onKeyUp={e=>e.keyCode===13 && search(value)} 
        />
        <Button size='large' icon='search' basic onClick={()=>search(value)} floated='right'/>
      </InputBox>
      <BookList className={booklist.length>0 ? 'hasMarginTop' : ''}>
        {
          booklist.map((v,i)=>{
            return <div className='item' key={v.id} style={{'--duration-ms':`${i*120}ms`}}>
             <span>{v.name}</span>
             <button onClick={()=>downloadFile(v.webContentLink)}><Icon name='download' color='grey' /></button>
            </div>
          })
        }
      </BookList>
  </AppWrapper>
  
}

export default App
