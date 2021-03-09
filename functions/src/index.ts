import * as functions from 'firebase-functions';
import * as admin from'firebase-admin';
admin.initializeApp(functions.config().firebase);
export const firestore = admin.firestore();
import { ChatRoom } from'./model/ChatRoom';
//import { Messages } from'./model/Messages';
//import { Users } from'./model/Users';
//import { user } from 'firebase-functions/lib/providers/auth';

//マッチングルーム作成
export const createMatchingRoom = functions.firestore.document('/ChatRooms/{room}')
    .onUpdate(async (snapshot, context) => {
        //const oldValue = change.before.data() as ChatRoom
        const path = snapshot.after.ref.id
        const newValue = snapshot.after.data() as ChatRoom
        const data3 = newValue[3];
        const data4 = newValue[4];
    
    if (data3 == true && data4 == true) { 
        console.log("マッチングルームを作成")
        const date = Date()
        firestore.collection("MatchingRooms").doc().set({"1":newValue[1],"2":newValue[2],"firstEnter1":false
            ,"firstEnter2":false,"useMatchingTicket1":false,"useMatchingTicket2":false,"LastRefreshTime":date}, { merge: true });
        await firestore.collection("ChatRooms").doc(path).delete()
    }
});

//新着メッセージ通知(通話前)
export const pushNotification = functions.firestore.document('/ChatRooms/{room}/Messages/{mes}')
    .onCreate(async (snapshot, context) => {
        const name = snapshot.get("displayName");
        const text = snapshot.get("text");
        const token = snapshot.get("token")
        const uid = snapshot.get("uid")
        const db = snapshot.get("DB")
        const newmesNumRef = firestore.collection(db).doc(uid)
        if (token == null) {
            return
        }else{
            newmesNumRef.get().then(function(doc){
                const newmesNum = doc.get("newMesNum") as number + 1
                const badge = `${newmesNum}`
                sendPushNotification(token,name,text,badge);
                newmesNumRef.set({"newMesNum":newmesNum},{merge:true})
            })
        }    
    })

//新着メッセージ通知(通話後)
export const pushNotificationAfter = functions.firestore.document('/MatchingRooms/{room}/Messages/{mes}')
    .onCreate(async (snapshot, context) => {
        const name = snapshot.get("displayName")
        const text = snapshot.get("text")
        const token = snapshot.get("token")
        const uid = snapshot.get("uid")
        const db = snapshot.get("DB")
        const newmesNumRef = firestore.collection(db).doc(uid)
        if (token == null) {
            return
        }else{
            newmesNumRef.get().then(function(doc){
                const newmesNum = doc.get("newMesNum") as number + 1
                const badge = `${newmesNum}`
                sendPushNotification(token,name,text,badge);
                newmesNumRef.set({"newMesNum":newmesNum},{merge:true})
            })
        }    
    })

//新着いいねの通知(男)
export const newGoodNotification_male = functions.firestore.document('/Male_Users/{users}/Good_Users/{goods}')
    .onCreate(async (snapshot, context) => {
        console.log('newGood recieve')
        const uid = snapshot.ref.parent.parent?.id
        const userRef = firestore.collection("Male_Users").doc(uid as string)

        userRef.get().then(function(doc){
            if (doc.exists == true) {
                const token = doc.get("token")
                const mesNum = doc.get("newMesNum") as number + 1
                const badge = `${mesNum}`
                const title = "新着いいね"
                const body = `${snapshot.get("name") as string}からいいねが来ています！`
                sendPushNotification(token,title,body,badge);

                userRef.set({"newMesNum":mesNum},{merge:true})
            }else{
                console.log("notExsists")
            }
        })   
    })

//新着いいねの通知(女)
export const newGoodNotification_female = functions.firestore.document('/Female_Users/{users}/Good_Users/{goods}')
    .onCreate(async (snapshot, context) => {
        console.log('newGood recieve')
        const uid = snapshot.ref.parent.parent?.id
        const userRef = firestore.collection("Female_Users").doc(uid as string)

        userRef.get().then(function(doc){
            if (doc.exists) {
                const token = doc.get("token")
                const mesNum = doc.get("newMesNum") as number + 1
                const badge = `${mesNum}`
                const title = "新着いいね"
                const body = `${snapshot.get("name") as string}からいいねが来ています！`

                sendPushNotification(token,title,body,badge);

                userRef.set({"newMesNum":mesNum},{merge:true})
            }else{
                console.log("notExsists")
            }
            
        })   
    })

var sendPushNotification = function(token:string,title:string,body:string,badge:string) {

    const payload = {
        notification: {
            title: title,
            body: body,
            badge: badge,
            sound:"default"
        }
    };
    const option = {
        priority: "high"
    };
    admin.messaging().sendToDevice(token,payload,option);
}