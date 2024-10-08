'use client';
import React, { useState, useEffect, useRef } from 'react';

// Fonction pour calculer le temps restant avant un événement
const calculateTimeLeft = (eventDate) => {
  const difference = +new Date(eventDate) - +new Date();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

function SocialCalendar() {
  const eventColors = ["bg-pink-500", "bg-purple-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-indigo-500"];
  
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Apéro chez Marie",
      description: "Soirée détente chez Marie avec snacks et boissons.",
      date: "2024-10-08T20:00:00",
      color: eventColors[0],
      participants: {
        attending: [],
        declined: [],
        tentative: [],
        pending: []
      },
      chat: [],
      isOpen: false,
      notifications: {}
    }
  ]);

  const [profile, setProfile] = useState({
    id: "user1", // ID utilisateur
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    photo: null,
    chatColor: `hsl(${Math.random() * 360}, 70%, 50%)`, // Couleur unique pour chaque profil
  });

  const [isProfileCreated, setIsProfileCreated] = useState(false); // Contrôle la création du profil
  const [groupName, setGroupName] = useState("Mon Groupe d'Amis");
  const [inviteCode, setInviteCode] = useState(""); // Code d'invitation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: ""
  });
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef({});
  const eventContainerRef = useRef([]);

  // Fonction pour générer le code d'invitation
  const inviteFriendsToGroup = () => {
    const generatedCode = `GROUP-${Math.random().toString(36).substring(7)}`;
    setInviteCode(generatedCode);
  };

  // Fonction pour trier les événements par date
  const sortEventsByDate = (eventsToSort) => {
    return [...eventsToSort].sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Fonction pour ajouter un nouvel événement
  const addEvent = (e) => {
    e.preventDefault();
    const existingColors = events.map(event => event.color);
    const availableColors = eventColors.filter(color => !existingColors.includes(color));
    const newColor = availableColors.length > 0 
      ? availableColors[0] 
      : eventColors[events.length % eventColors.length];

    const newEventWithId = {
      ...newEvent,
      id: events.length + 1,
      color: newColor,
      participants: {
        attending: [profile],
        declined: [],
        tentative: [],
        pending: []
      },
      chat: [],
      isOpen: false,
      notifications: {}
    };
    
    const updatedEvents = sortEventsByDate([...events, newEventWithId]);
    setEvents(updatedEvents);
    setIsModalOpen(false);
    setNewEvent({ title: "", description: "", date: "" });
  };

  // Fonction pour supprimer un événement
  const deleteEvent = (eventId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      setEvents(events.filter(event => event.id !== eventId));
    }
  };

  // Fonction pour notifier un participant
  const notifyParticipant = (eventId, participantId, notificationType) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const currentNotifications = event.notifications[participantId] || 0;
        if (currentNotifications < 5) {
          return {
            ...event,
            notifications: {
              ...event.notifications,
              [participantId]: currentNotifications + 1
            }
          };
        }
      }
      return event;
    }));
  };

  // Menu de notification pour les bulles de participants
  const NotificationMenu = ({ eventId, participant }) => {
    const notifications = [
      { text: "Allez motive-toi !", emoji: "💪" },
      { text: "Viens !", emoji: "🎉" },
      { text: "Échappé.", emoji: "🏃" },
      { text: "WHY ?", emoji: "❓" }
    ];

    return (
      <div className="absolute z-50 bg-white rounded-lg shadow-lg p-2">
        {notifications.map((notif, index) => (
          <button
            key={index}
            onClick={() => notifyParticipant(eventId, participant.id, notif.text)}
            className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
          >
            {notif.emoji} {notif.text}
          </button>
        ))}
      </div>
    );
  };

  // Gestion de l'ouverture et de la fermeture des événements
  const toggleEventOpen = (eventId) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        return { ...event, isOpen: !event.isOpen };
      }
      return event;
    }));
  };

  // Gestion du temps restant avant chaque événement
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      events.forEach(event => {
        const timeLeftForEvent = calculateTimeLeft(event.date);
        setTimeLeft(prev => ({ ...prev, [event.id]: timeLeftForEvent }));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [events]);

  // Fonction pour envoyer un message dans le chat
  const handleSendMessage = (eventId, e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const updatedEvents = events.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            chat: [...event.chat, {
              id: event.chat.length + 1,
              sender: profile,
              content: newMessage,
              timestamp: new Date().toISOString()
            }]
          };
        }
        return event;
      });
      setEvents(updatedEvents);
      setNewMessage("");
      
      if (chatContainerRef.current[eventId]) {
        chatContainerRef.current[eventId].scrollTop = chatContainerRef.current[eventId].scrollHeight;
      }
    }
  };

  if (!isProfileCreated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-2xl mb-6">Créer votre profil</h1>
        <form onSubmit={(e) => {
            e.preventDefault();
            setIsProfileCreated(true);
          }} className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
          <div className="mb-4">
            <label className="block text-gray-700">Prénom</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Nom</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Âge</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Sexe</label>
            <select
              className="w-full p-2 border rounded"
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              required
            >
              <option value="">Sélectionner</option>
              <option value="Male">Homme</option>
              <option value="Female">Femme</option>
              <option value="Other">Autre</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Photo de profil</label>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  setProfile({ ...profile, photo: reader.result });
                };
                reader.readAsDataURL(file);
              }
            }} />
            {profile.photo && (
              <div className="mt-4">
                <img
                  src={profile.photo}
                  alt="Aperçu de la photo"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Créer mon profil</button>
        </form>

        {/* Bouton pour inviter des amis */}
        <button className="mt-4 bg-green-500 text-white p-2 rounded" onClick={inviteFriendsToGroup}>
          Inviter des amis au groupe
        </button>
        {inviteCode && (
          <div className="mt-4">
            <p>Code d'invitation : <strong>{inviteCode}</strong></p>
            <button onClick={() => navigator.clipboard.writeText(inviteCode)} className="bg-gray-200 p-2 rounded">
              Copier le code
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 p-4 overflow-auto">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Quoi de prévu ?</h1>
          <div className="flex items-center">
            <img
              src={profile.photo || "/api/placeholder/32/32"}
              alt="Photo de profil"
              className="w-8 h-8 rounded-full mr-2"
            />
            <span>{profile.firstName} {profile.lastName}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700">Nom du groupe :</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          {sortEventsByDate(events).map((event) => (
            <div
              key={event.id}
              className={`${event.color} text-white rounded-xl p-6 transition-all duration-300 ${event.isOpen ? 'max-h-[32rem]' : 'max-h-24 overflow-hidden'}`}
              ref={(el) => (eventContainerRef.current[event.id] = el)}
            >
              <div className="flex justify-between items-start mb-4">
                <div onClick={() => toggleEventOpen(event.id)} className="cursor-pointer flex-grow">
                  <h2 className="text-2xl font-bold">{event.title}</h2>
                  <p className="text-sm">{new Date(event.date).toLocaleString()}</p>
                </div>
                {!event.isOpen && timeLeft[event.id] && timeLeft[event.id].days > 0 && (
                  <div className="text-2xl font-bold ml-4">
                    J-{timeLeft[event.id].days}
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                  className="ml-4 text-white hover:text-red-200"
                >
                  🗑️
                </button>
              </div>

              {event.isOpen && (
                <div>
                  <p>{event.description}</p>

                  {timeLeft[event.id] && (
                    <div className="mb-4">
                      ⏳ {timeLeft[event.id].days}j {timeLeft[event.id].hours}h {timeLeft[event.id].minutes}m {timeLeft[event.id].seconds}s
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">Ta participation :</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateParticipation(event.id, 'attending'); }}
                        className={`px-3 py-1 rounded-full text-sm ${
                          event.participants.attending.some(p => p.firstName === profile.firstName)
                            ? 'bg-white text-green-500'
                            : 'bg-white/20'
                        }`}
                      >
                        ✓ J'y vais
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateParticipation(event.id, 'tentative'); }}
                        className={`px-3 py-1 rounded-full text-sm ${
                          event.participants.tentative.some(p => p.firstName === profile.firstName)
                            ? 'bg-white text-yellow-500'
                            : 'bg-white/20'
                        }`}
                      >
                        🤔 J'me tâte
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateParticipation(event.id, 'declined'); }}
                        className={`px-3 py-1 rounded-full text-sm ${
                          event.participants.declined.some(p => p.firstName === profile.firstName)
                            ? 'bg-white text-red-500'
                            : 'bg-white/20'
                        }`}
                      >
                        ✗ Je ne peux pas
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">Participants :</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(event.participants).map(([status, participants]) =>
                        participants.map((participant, index) => (
                          <div
                            key={`${status}-${index}`}
                            className="relative cursor-pointer group"
                            onClick={() => notifyParticipant(event.id, participant.id)}
                          >
                            <div
                              className={`relative bg-${status === 'attending' ? 'green' : status === 'tentative' ? 'yellow' : 'red'}-400 rounded-full w-8 h-8 flex items-center justify-center`}
                              title={participant.firstName}
                            >
                              <img src={participant.photo || "/api/placeholder/32/32"} alt="Participant" className="w-full h-full rounded-full object-cover" />
                              <div className={`absolute bottom-0 right-0 bg-${status === 'attending' ? 'green' : status === 'tentative' ? 'yellow' : 'red'}-500 rounded-full w-4 h-4 flex items-center justify-center text-xs`}>
                                {status === 'attending' ? '👍' : status === 'tentative' ? '🤔' : '👎'}
                              </div>
                              {event.notifications[participant.id] && (
                                <div className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                  +{event.notifications[participant.id]}
                                </div>
                              )}
                            </div>
                            <div className="hidden group-hover:block">
                              <NotificationMenu eventId={event.id} participant={participant} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">Discussion :</h3>
                    <div
                      className="bg-gray-800 text-white p-4 rounded-lg h-40 overflow-y-auto"
                      ref={(el) => (chatContainerRef.current[event.id] = el)}
                    >
                      {event.chat.map((message) => (
                        <div key={message.id} style={{ color: message.sender.chatColor }}>
                          <strong>{message.sender.firstName}</strong>: {message.content}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={(e) => handleSendMessage(event.id, e)} className="mt-2 flex">
                      <input
                        type="text"
                        className="w-full p-2 border rounded-l bg-gray-700 text-white placeholder-gray-400"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écris un message..."
                      />
                      <button type="submit" className="bg-blue-500 text-white p-2 rounded-r">
                        Envoyer
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 rounded-full bg-purple-500 text-white p-4 shadow-lg"
        >
          + Nouvel évènement
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Créer un nouvel événement</h2>
              <form onSubmit={addEvent}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Nom de l'événement</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Date et heure</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border rounded"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-500 text-white rounded"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialCalendar;
