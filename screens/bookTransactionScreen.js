import React,{Component} from 'react'
import {View,Text,TouchableOpacity,TextInput} from 'react-native'
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import * as firebase from 'firebase'
import db from '../config'
export default class BookTransactionScreen extends Component{
    constructor(){
        super()
        this.state={
            hasCameraPermission:null,
            scanData:'',
            scan:false,
            buttonState:'normal',
            scanBookId:'',
            scanStudentID:'',
            transactionMessage:'',

        }
    }
    GetCameraPermission=async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermission:status==='granted',
            buttonState:id,
            scan:false
            
        })
        
    }
    HandleBarcodeScan=async({type,data})=>{
        const {buttonState}=this.state
        if(buttonState==='BookId'){
            this.setState({
                scan:true,
                scanBookId:data,
                buttonState:'normal'
            })
        }
        else if(buttonState==='StudentId'){
            this.setState({
                scan:true,
                scanStudentId:data,
                buttonState:'normal'
            })
        }
    }
    handleTransaction=async()=>{
    var transactionMessage
    db.collection('Books').doc(this.state.scanBookId).get()
    .then(doc=>{
        var book=doc.data()
        if(book.BookAvailability){
         this.initiateBookIssue()
         transactionMessage='bookIssue'
           
        }
        else{
        this.initiateBookReturn()
        transactionMessage='bookReturn'
        }
    })
    this.setState({
       transactionMessage:transactionMessage 
    })
    }
    initiateBookIssue=async()=>{
        db.collection('Transactions').add({
            'studentID':this.state.scanStudentID,
            'bookID':this.state.scanBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':'issued'
        })
        db.collection('Books').doc(this.state.scanBookId).update({'BookAvailability':false})
        db.collection('Student').doc(this.state.scanStudentID).update({'NumbersOfBooksIssued':firebase.firestore.FieldValue.increment(1)})
        alert('bookIssue')
        this.setState({
            scanBookId:'',
            scanStudentID:'',
        })
    }
    initiateBookReturn=async()=>{
        db.collection('Transactions').add({
            'studentID':this.state.scanStudentID,
            'bookID':this.state.scanBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':'returned'
        })
        db.collection('Books').doc(this.state.scanBookId).update({'BookAvailability':true})
        db.collection('Student').doc(this.state.scanStudentID).update({'NumbersOfBooksIssued':firebase.firestore.FieldValue.increment(-1)})
        alert('bookIssue')
        this.setState({
            scanBookId:'',
            scanStudentID:'',
        })
    }
    render(){
        if (this.state.buttonState!=='normal' && this.state.hasCameraPermission){
            return(
                <BarCodeScanner
                onBarCodeScanned={this.state.scan?undefined:this.HandleBarcodeScan}
                style={StyleSheet.absoluteFillObject}
                />
            )
        }
        else if(this.state.buttonState==='normal'){
        
        
        return(
            <View>
                <TextInput placeholder='Book ID'
                onChangeText={(text)=>{
                    this.setState({
                        scanBookId:text
                    })
                }}
                value={this.state.scanBookId}
                />
                <TouchableOpacity
                onPress={()=>{this.GetCameraPermission('BookId')}}
                >
                    <Text>Scan book ID</Text>
                </TouchableOpacity>
                <TextInput placeholder='Student ID'
                onChangeText={(text)=>{
                    this.setState({
                        scanStudentId:text
                    })
                }}
                value={this.state.scanStudentId}
                />
                <TouchableOpacity
                onPress={()=>{this.GetCameraPermission('StudentId')}}
                >
                    <Text>Scan student ID</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>{this.handleTransaction}}>
                    <Text>
                        submit
                    </Text>
                </TouchableOpacity>
            </View>
        )
    }
}   
}